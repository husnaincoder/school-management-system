<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\IncomeExpense;
use App\Models\FeeAssignment;
use App\Models\AcademicSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $academicSessionId = $request->academic_session_id ?? AcademicSession::getCurrentSession()?->id;

        $query = IncomeExpense::with('academicSession', 'createdBy')
            ->when($academicSessionId, fn($q) => $q->where('academic_session_id', $academicSessionId));

        $totalIncome = (clone $query)->income()->sum('amount');
        $totalExpense = (clone $query)->expense()->sum('amount');

        $transactions = $query->orderBy('date', 'desc')->paginate(20);

        $recentPayments = collect([]);

        $pendingFees = FeeAssignment::where('status', 'pending')
            ->with('student.user', 'academicSession')
            ->get();

        return inertia('dashboard/accountant/Index', [
            'transactions' => $transactions,
            'totalIncome' => $totalIncome,
            'totalExpense' => $totalExpense,
            'netProfit' => $totalIncome - $totalExpense,
            'recentPayments' => $recentPayments,
            'pendingFees' => $pendingFees,
        ]);
    }

    public function incomeStore(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'payment_method' => 'nullable|string',
            'reference_no' => 'nullable|string',
        ]);

        $validated['type'] = 'income';
        $validated['created_by'] = Auth::id();

        IncomeExpense::create($validated);

        return back()->with('success', 'Income added successfully.');
    }

    public function expenseStore(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'category' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'payment_method' => 'nullable|string',
            'reference_no' => 'nullable|string',
        ]);

        $validated['type'] = 'expense';
        $validated['created_by'] = Auth::id();

        IncomeExpense::create($validated);

        return back()->with('success', 'Expense added successfully.');
    }

    public function reports(Request $request)
    {
        $academicSessionId = $request->academic_session_id ?? AcademicSession::getCurrentSession()?->id;
        $startDate = $request->start_date ?? now()->startOfMonth()->format('Y-m-d');
        $endDate = $request->end_date ?? now()->endOfMonth()->format('Y-m-d');

        $query = IncomeExpense::whereBetween('date', [$startDate, $endDate])
            ->when($academicSessionId, fn($q) => $q->where('academic_session_id', $academicSessionId));

        $incomeByCategory = (clone $query)->income()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get();

        $expenseByCategory = (clone $query)->expense()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get();

        $monthlyIncome = IncomeExpense::income()
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('MONTH(date) as month, SUM(amount) as total')
            ->groupBy('MONTH(date)')
            ->get();

        $monthlyExpense = IncomeExpense::expense()
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('MONTH(date) as month, SUM(amount) as total')
            ->groupBy('MONTH(date)')
            ->get();

        return inertia('dashboard/accountant/Reports', [
            'incomeByCategory' => $incomeByCategory,
            'expenseByCategory' => $expenseByCategory,
            'monthlyIncome' => $monthlyIncome,
            'monthlyExpense' => $monthlyExpense,
            'filters' => $request->only(['academic_session_id', 'start_date', 'end_date']),
        ]);
    }
}
