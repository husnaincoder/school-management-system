<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ScholarShip;
use Illuminate\Http\Request;

class ScholarShipController extends Controller
{
    /**
     * Display a listing of scholarships.
     */
    public function index(Request $request)
    {
        $query = ScholarShip::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $scholarShips = $query->orderBy('name')->get();

        return inertia('dashboard/fee/ScholarShips', [
            'scholarShips' => $scholarShips,
            'filterType' => $request->get('type', ''),
            'types' => ['percentage', 'fixed'],
        ]);
    }

    /**
     * Store a newly created scholarship.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:scholar_ships,name',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
        ], [
            'name.required' => 'Scholarship name is required.',
            'name.unique' => 'A scholarship with this name already exists.',
            'type.required' => 'Type is required.',
            'value.required' => 'Value is required.',
        ]);

        ScholarShip::create($validated);

        return back()->with('success', 'Scholarship created successfully.');
    }

    /**
     * Update the specified scholarship.
     */
    public function update(Request $request, ScholarShip $scholarship)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:scholar_ships,name,' . $scholarship->id,
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
        ], [
            'name.required' => 'Scholarship name is required.',
            'name.unique' => 'A scholarship with this name already exists.',
            'type.required' => 'Type is required.',
            'value.required' => 'Value is required.',
        ]);

        $scholarship->update($validated);

        return back()->with('success', 'Scholarship updated successfully.');
    }

    /**
     * Remove the specified scholarship.
     */
    public function destroy(ScholarShip $scholarship)
    {
        $scholarship->delete();

        return back()->with('success', 'Scholarship deleted successfully.');
    }
}

