<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\SiblingDiscount;
use Illuminate\Http\Request;

class SiblingDiscountController extends Controller
{
    /**
     * Display a listing of sibling discount rules.
     * Logic to auto-apply via parent_id is in the business layer.
     */
    public function index()
    {
        $siblingDiscounts = SiblingDiscount::orderBy('percentage')->get();

        return inertia('dashboard/fee/SiblingDiscounts', [
            'siblingDiscounts' => $siblingDiscounts,
        ]);
    }

    /**
     * Store a newly created sibling discount.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'percentage' => 'required|numeric|min:0|max:100',
        ], [
            'percentage.required' => 'Percentage is required.',
            'percentage.min' => 'Percentage must be at least 0.',
            'percentage.max' => 'Percentage must not exceed 100.',
        ]);

        SiblingDiscount::create($validated);

        return back()->with('success', 'Sibling discount added successfully.');
    }

    /**
     * Update the specified sibling discount.
     */
    public function update(Request $request, SiblingDiscount $siblingDiscount)
    {
        $validated = $request->validate([
            'percentage' => 'required|numeric|min:0|max:100',
        ], [
            'percentage.required' => 'Percentage is required.',
            'percentage.min' => 'Percentage must be at least 0.',
            'percentage.max' => 'Percentage must not exceed 100.',
        ]);

        $siblingDiscount->update($validated);

        return back()->with('success', 'Sibling discount updated successfully.');
    }

    /**
     * Remove the specified sibling discount.
     */
    public function destroy(SiblingDiscount $siblingDiscount)
    {
        $siblingDiscount->delete();

        return back()->with('success', 'Sibling discount removed successfully.');
    }
}
