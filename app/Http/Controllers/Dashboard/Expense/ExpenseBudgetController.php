<?php

namespace App\Http\Controllers\Dashboard\Expense;

use App\Http\Controllers\Controller;
use App\Models\ExpenseBudget;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseBudgetController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->get('year', (int) date('Y'));
        $budgets = ExpenseBudget::with('category:id,name')
            ->where('year', $year)
            ->orderBy('category_id')
            ->get()
            ->map(fn (ExpenseBudget $b) => [
                'id' => $b->id,
                'category_id' => $b->category_id,
                'category_name' => $b->category?->name,
                'budget_amount' => $b->budget_amount,
                'spent_amount' => $b->spent_amount,
                'year' => $b->year,
                'month' => $b->month,
                'remaining' => round((float) $b->budget_amount - (float) $b->spent_amount, 2),
            ]);

        return Inertia::render('dashboard/expense/ExpenseBudgets', [
            'budgets' => $budgets,
            'categories' => ExpenseCategory::active()->orderBy('name')->get(['id', 'name']),
            'filterYear' => $year,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'budget_amount' => 'required|numeric|min:0',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'nullable|integer|min:1|max:12',
        ]);
        $existing = ExpenseBudget::where('category_id', $validated['category_id'])
            ->where('year', $validated['year'])
            ->when(isset($validated['month']), fn ($q) => $q->where('month', $validated['month']), fn ($q) => $q->whereNull('month'))
            ->first();
        if ($existing) {
            return back()->with('error', 'Budget already exists for this category and period.');
        }
        ExpenseBudget::create([
            'category_id' => $validated['category_id'],
            'budget_amount' => $validated['budget_amount'],
            'spent_amount' => 0,
            'year' => $validated['year'],
            'month' => $validated['month'] ?? null,
        ]);
        return back()->with('success', 'Budget created successfully.');
    }

    public function update(Request $request, ExpenseBudget $expense_budget)
    {
        $validated = $request->validate([
            'budget_amount' => 'required|numeric|min:0',
        ]);
        $expense_budget->update(['budget_amount' => $validated['budget_amount']]);
        return back()->with('success', 'Budget updated successfully.');
    }

    public function destroy(ExpenseBudget $expense_budget)
    {
        $expense_budget->delete();
        return back()->with('success', 'Budget deleted successfully.');
    }
}
