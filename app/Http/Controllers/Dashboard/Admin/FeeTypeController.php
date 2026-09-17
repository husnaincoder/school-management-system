<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeeType;
use Illuminate\Http\Request;

class FeeTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = FeeType::query();
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        $feeTypes = $query->orderBy('name')->get();

        return inertia('dashboard/fee/FeeTypes', [
            'feeTypes' => $feeTypes,
            'filterCategory' => $request->get('category', ''),
            'categories' => FeeType::CATEGORIES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:fee_types,name',
            'category' => 'required|in:' . implode(',', FeeType::CATEGORIES),
            'is_refundable' => 'sometimes|boolean',
        ], [
            'name.required' => 'Fee type name is required.',
            'name.unique' => 'A fee type with this name already exists.',
            'category.required' => 'Category is required.',
        ]);
        $validated['is_refundable'] = $request->boolean('is_refundable', false);
        FeeType::create($validated);

        return back()->with('success', 'Fee type created.');
    }

    public function update(Request $request, FeeType $feeType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:fee_types,name,' . $feeType->id,
            'category' => 'required|in:' . implode(',', FeeType::CATEGORIES),
            'is_refundable' => 'sometimes|boolean',
        ], [
            'name.required' => 'Fee type name is required.',
            'name.unique' => 'A fee type with this name already exists.',
            'category.required' => 'Category is required.',
        ]);
        $validated['is_refundable'] = $request->boolean('is_refundable', false);
        $feeType->update($validated);

        return back()->with('success', 'Fee type updated.');
    }

    public function destroy(FeeType $feeType)
    {
        $feeType->delete();
        return back()->with('success', 'Fee type deleted.');
    }
}
