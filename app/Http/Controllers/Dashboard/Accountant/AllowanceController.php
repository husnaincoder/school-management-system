<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Allowance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AllowanceController extends Controller
{
    public function index(Request $request)
    {
        $allowances = Allowance::orderBy('name')->get()->map(fn (Allowance $a) => [
            'id' => $a->id,
            'name' => $a->name,
            'type' => $a->type,
            'value' => $a->value,
            'is_active' => $a->is_active,
        ]);

        return Inertia::render('dashboard/payroll/Allowances', [
            'allowances' => $allowances,
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
        Allowance::create($validated);
        return back()->with('success', 'Allowance created successfully.');
    }

    public function update(Request $request, Allowance $allowance)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        $allowance->update($validated);
        return back()->with('success', 'Allowance updated successfully.');
    }

    public function destroy(Allowance $allowance)
    {
        $allowance->delete();
        return back()->with('success', 'Allowance deleted successfully.');
    }
}
