<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\SalaryAdvance;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryAdvanceController extends Controller
{
    public function index(Request $request)
    {
        $advances = SalaryAdvance::with('employee.user', 'teacher.user')
            ->orderByDesc('request_date')
            ->get()
            ->map(fn (SalaryAdvance $a) => [
                'id' => $a->id,
                'employee_id' => $a->employee_id,
                'teacher_id' => $a->teacher_id,
                'employee_name' => $a->employee_id ? ($a->employee?->user?->name ?? '—') : ($a->teacher?->user?->name ?? '—'),
                'amount' => $a->amount,
                'request_date' => $a->request_date?->format('Y-m-d'),
                'approved_date' => $a->approved_date?->format('Y-m-d'),
                'status' => $a->status,
                'recovered_amount' => $a->recovered_amount,
                'remarks' => $a->remarks,
            ]);

        return Inertia::render('dashboard/payroll/SalaryAdvances', [
            'advances' => $advances,
            'employees' => Employee::with('user')->get()->map(fn ($e) => ['id' => $e->id, 'name' => $e->user?->name ?? '—', 'employee_id' => $e->employee_id]),
            'teachers' => Teacher::with('user')->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? '—', 'staff_id' => $t->staff_id]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|required_without:teacher_id|exists:employees,id',
            'teacher_id' => 'nullable|required_without:employee_id|exists:teachers,id',
            'amount' => 'required|numeric|min:0.01',
            'request_date' => 'required|date',
            'remarks' => 'nullable|string|max:500',
        ]);
        $validated['status'] = 'pending';
        SalaryAdvance::create($validated);
        return back()->with('success', 'Salary advance request created.');
    }

    public function approve(SalaryAdvance $salaryAdvance)
    {
        if ($salaryAdvance->status !== 'pending') {
            return back()->with('error', 'Only pending advances can be approved.');
        }
        $salaryAdvance->update(['status' => 'approved', 'approved_date' => now()]);
        return back()->with('success', 'Advance approved.');
    }

    public function reject(SalaryAdvance $salaryAdvance)
    {
        if ($salaryAdvance->status !== 'pending') {
            return back()->with('error', 'Only pending advances can be rejected.');
        }
        $salaryAdvance->update(['status' => 'rejected']);
        return back()->with('success', 'Advance rejected.');
    }

    public function destroy(SalaryAdvance $salaryAdvance)
    {
        if ($salaryAdvance->status === 'recovered') {
            return back()->with('error', 'Cannot delete recovered advance.');
        }
        $salaryAdvance->delete();
        return back()->with('success', 'Advance deleted.');
    }
}
