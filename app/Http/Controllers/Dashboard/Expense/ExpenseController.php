<?php

namespace App\Http\Controllers\Dashboard\Expense;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenceItem;
use App\Models\ExpenseCategory;
use App\Models\ExpensePayment;
use App\Models\Vendor;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('category:id,name', 'vendor:id,name')
            ->orderByDesc('expense_date')
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('expense_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('expense_date', '<=', $request->to_date);
        }

        $expenses = $query->get()->map(fn (Expense $e) => [
            'id' => $e->id,
            'expense_number' => $e->expense_number,
            'category_id' => $e->category_id,
            'category_name' => $e->category?->name,
            'vendor_id' => $e->vendor_id,
            'vendor_name' => $e->vendor?->name,
            'expense_date' => $e->expense_date?->format('Y-m-d'),
            'total_amount' => $e->total_amount,
            'paid_amount' => $e->paid_amount,
            'due_amount' => $e->due_amount,
            'status' => $e->status,
            'notes' => $e->notes,
        ]);

        return Inertia::render('dashboard/expense/Expenses', [
            'expenses' => $expenses,
            'categories' => ExpenseCategory::active()->orderBy('name')->get(['id', 'name']),
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['status', 'category_id', 'from_date', 'to_date']),
        ]);
    }

    public function create()
    {
        return Inertia::render('dashboard/expense/ExpenseForm', [
            'categories' => ExpenseCategory::active()->orderBy('name')->get(['id', 'name']),
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'expense_date' => 'required|date',
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $totalAmount = 0;
        foreach ($validated['items'] as $row) {
            $totalAmount += (float) $row['quantity'] * (float) $row['unit_price'];
        }
        $totalAmount = round($totalAmount, 2);

        $expense = Expense::create([
            'expense_number' => Expense::generateExpenseNumber(),
            'category_id' => $validated['category_id'],
            'vendor_id' => $validated['vendor_id'] ?? null,
            'expense_date' => $validated['expense_date'],
            'total_amount' => $totalAmount,
            'paid_amount' => 0,
            'due_amount' => $totalAmount,
            'notes' => $validated['notes'] ?? null,
            'status' => Expense::STATUS_PENDING,
        ]);

        foreach ($validated['items'] as $row) {
            $qty = (int) $row['quantity'];
            $unit = (float) $row['unit_price'];
            ExpenceItem::create([
                'expense_id' => $expense->id,
                'item_name' => $row['item_name'],
                'quantity' => $qty,
                'unit_price' => $unit,
                'total_price' => round($qty * $unit, 2),
            ]);
        }

        return redirect()->route('expenses.show', $expense->id)->with('success', 'Expense created successfully.');
    }

    public function show(Expense $expense)
    {
        $expense->load('category:id,name', 'vendor:id,name', 'items', 'payments');
        return Inertia::render('dashboard/expense/ExpenseShow', [
            'expense' => [
                'id' => $expense->id,
                'expense_number' => $expense->expense_number,
                'category_id' => $expense->category_id,
                'category_name' => $expense->category?->name,
                'vendor_id' => $expense->vendor_id,
                'vendor_name' => $expense->vendor?->name,
                'expense_date' => $expense->expense_date?->format('Y-m-d'),
                'total_amount' => $expense->total_amount,
                'paid_amount' => $expense->paid_amount,
                'due_amount' => $expense->due_amount,
                'status' => $expense->status,
                'notes' => $expense->notes,
                'items' => $expense->items->map(fn ($i) => [
                    'id' => $i->id,
                    'item_name' => $i->item_name,
                    'quantity' => $i->quantity,
                    'unit_price' => $i->unit_price,
                    'total_price' => $i->total_price,
                ])->values()->all(),
                'payments' => $expense->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'payment_date' => $p->payment_date?->format('Y-m-d'),
                    'payment_method' => $p->payment_method,
                    'transaction_id' => $p->transaction_id,
                    'remarks' => $p->remarks,
                ])->values()->all(),
            ],
        ]);
    }

    public function edit(Expense $expense)
    {
        $expense->load('items');
        return Inertia::render('dashboard/expense/ExpenseForm', [
            'expense' => [
                'id' => $expense->id,
                'category_id' => $expense->category_id,
                'vendor_id' => $expense->vendor_id,
                'expense_date' => $expense->expense_date?->format('Y-m-d'),
                'notes' => $expense->notes,
                'items' => $expense->items->map(fn ($i) => [
                    'id' => $i->id,
                    'item_name' => $i->item_name,
                    'quantity' => $i->quantity,
                    'unit_price' => $i->unit_price,
                    'total_price' => $i->total_price,
                ])->values()->all(),
            ],
            'categories' => ExpenseCategory::active()->orderBy('name')->get(['id', 'name']),
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'vendor_id' => 'nullable|exists:vendors,id',
            'expense_date' => 'required|date',
            'notes' => 'nullable|string|max:2000',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        $totalAmount = 0;
        foreach ($validated['items'] as $row) {
            $totalAmount += (float) $row['quantity'] * (float) $row['unit_price'];
        }
        $totalAmount = round($totalAmount, 2);

        $expense->update([
            'category_id' => $validated['category_id'],
            'vendor_id' => $validated['vendor_id'] ?? null,
            'expense_date' => $validated['expense_date'],
            'notes' => $validated['notes'] ?? null,
            'total_amount' => $totalAmount,
            'due_amount' => round($totalAmount - (float) $expense->paid_amount, 2),
        ]);

        $expense->items()->delete();
        foreach ($validated['items'] as $row) {
            $qty = (int) $row['quantity'];
            $unit = (float) $row['unit_price'];
            ExpenceItem::create([
                'expense_id' => $expense->id,
                'item_name' => $row['item_name'],
                'quantity' => $qty,
                'unit_price' => $unit,
                'total_price' => round($qty * $unit, 2),
            ]);
        }

        return redirect()->route('expenses.show', $expense->id)->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return redirect()->route('expenses.index')->with('success', 'Expense deleted successfully.');
    }

    public function storePayment(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|max:100',
            'transaction_id' => 'nullable|string|max:100',
            'remarks' => 'nullable|string|max:500',
        ]);
        $amount = (float) $validated['amount'];
        $newPaid = (float) $expense->paid_amount + $amount;
        $total = (float) $expense->total_amount;
        $newPaid = min($newPaid, $total);
        $due = round($total - $newPaid, 2);
        $status = $due <= 0 ? Expense::STATUS_PAID : Expense::STATUS_PARTIAL;

        ExpensePayment::create([
            'expense_id' => $expense->id,
            'amount' => $amount,
            'payment_date' => $validated['payment_date'],
            'payment_method' => $validated['payment_method'] ?? null,
            'transaction_id' => $validated['transaction_id'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        $expense->update([
            'paid_amount' => $newPaid,
            'due_amount' => $due,
            'status' => $status,
        ]);

        return back()->with('success', 'Payment recorded.');
    }

    /**
     * Export selected (or filtered) expenses as PDF.
     */
    public function exportPdf(Request $request)
    {
        $query = Expense::with('category:id,name', 'vendor:id,name')
            ->orderByDesc('expense_date')->orderByDesc('id');

        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        } else {
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }
            if ($request->filled('from_date')) {
                $query->whereDate('expense_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('expense_date', '<=', $request->to_date);
            }
        }

        $expenses = $query->limit(500)->get();
        if ($expenses->isEmpty()) {
            return redirect()->route('expenses.index')->with('error', 'No expenses to export.');
        }

        $schoolName = config('school.name', 'School');
        $logoPath = null;
        $logoRel = config('school.logo_path');
        if ($logoRel && is_file(public_path($logoRel))) {
            $logoPath = public_path($logoRel);
        }

        $pdf = Pdf::loadView('pdf.expenses-export', [
            'expenses' => $expenses,
            'schoolName' => $schoolName,
            'logoPath' => $logoPath,
        ])->setPaper('a4', 'landscape');
        $filename = 'expenses-' . now()->format('Y-m-d-His') . '.pdf';
        return $pdf->download($filename);
    }

    /**
     * Export selected (or filtered) expenses as Excel (CSV).
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $query = Expense::with('category:id,name', 'vendor:id,name')
            ->orderByDesc('expense_date')->orderByDesc('id');

        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        } else {
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }
            if ($request->filled('from_date')) {
                $query->whereDate('expense_date', '>=', $request->from_date);
            }
            if ($request->filled('to_date')) {
                $query->whereDate('expense_date', '<=', $request->to_date);
            }
        }

        $expenses = $query->limit(10000)->get();
        if ($expenses->isEmpty()) {
            return Response::streamDownload(function () {
                echo 'No expenses to export.';
            }, 'expenses-empty.csv', ['Content-Type' => 'text/csv']);
        }

        $filename = 'expenses-' . now()->format('Y-m-d-His') . '.csv';
        return Response::streamDownload(function () use ($expenses) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($out, [
                'Expense Number', 'Date', 'Category', 'Vendor', 'Total', 'Paid', 'Due', 'Status', 'Notes',
            ]);
            foreach ($expenses as $e) {
                fputcsv($out, [
                    $e->expense_number,
                    $e->expense_date?->format('Y-m-d'),
                    $e->category?->name ?? '',
                    $e->vendor?->name ?? '',
                    $e->total_amount,
                    $e->paid_amount,
                    $e->due_amount,
                    $e->status,
                    $e->notes ?? '',
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
