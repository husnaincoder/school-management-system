<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Deduction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeductionController extends Controller
{
    public function index(Request $request)
    {
        $deductions = Deduction::orderBy('name')->get()->map(fn (Deduction $d) => [
            'id' => $d->id,
            'name' => $d->name,
            'type' => $d->type,
            'value' => $d->value,
            'is_active' => $d->is_active,
        ]);

        return Inertia::render('dashboard/payroll/Deductions', [
            'deductions' => $deductions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        Deduction::create($validated);
        return back()->with('success', 'Deduction created successfully.');
    }

    public function update(Request $request, Deduction $deduction)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        $deduction->update($validated);
        return back()->with('success', 'Deduction updated successfully.');
    }

    public function destroy(Deduction $deduction)
    {
        $deduction->delete();
        return back()->with('success', 'Deduction deleted successfully.');
    }
}
