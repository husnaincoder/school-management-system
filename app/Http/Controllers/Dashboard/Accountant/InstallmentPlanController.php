<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\InstallmentPlan;
use Illuminate\Http\Request;

class InstallmentPlanController extends Controller
{
    /**
     * Display a listing of installment plans.
     */
    public function index()
    {
        $installmentPlans = InstallmentPlan::orderBy('number_of_installments')->get();

        return inertia('dashboard/fee/InstallmentPlans', [
            'installmentPlans' => $installmentPlans,
        ]);
    }

    /**
     * Store a newly created installment plan.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'number_of_installments' => 'required|integer|min:1',
        ], [
            'name.required' => 'Name is required.',
            'number_of_installments.required' => 'Number of installments is required.',
            'number_of_installments.min' => 'At least 1 installment is required.',
        ]);

        InstallmentPlan::create($validated);

        return back()->with('success', 'Installment plan created successfully.');
    }

    /**
     * Update the specified installment plan.
     */
    public function update(Request $request, InstallmentPlan $installmentPlan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'number_of_installments' => 'required|integer|min:1',
        ], [
            'name.required' => 'Name is required.',
            'number_of_installments.required' => 'Number of installments is required.',
            'number_of_installments.min' => 'At least 1 installment is required.',
        ]);

        $installmentPlan->update($validated);

        return back()->with('success', 'Installment plan updated successfully.');
    }

    /**
     * Remove the specified installment plan.
     */
    public function destroy(InstallmentPlan $installmentPlan)
    {
        $installmentPlan->delete();
        return back()->with('success', 'Installment plan removed successfully.');
    }
}
