<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubjectGroup;
use Illuminate\Http\Request;

class SubjectGroupController extends Controller
{
    public function index(Request $request)
    {
        $query = SubjectGroup::withCount('classSectionGroups');
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        $subjectGroups = $query->orderBy('name')->get();

        return inertia('dashboard/academic/SubjectGroups', [
            'subjectGroups' => $subjectGroups,
            'filterIsActive' => $request->get('is_active', ''),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:subject_groups,name',
            'is_active' => 'sometimes|boolean',
        ], [
            'name.required' => 'Subject group name is required.',
            'name.unique' => 'A subject group with this name already exists.',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        SubjectGroup::create($validated);

        return back()->with('success', 'Subject group created.');
    }

    public function update(Request $request, SubjectGroup $subjectGroup)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:subject_groups,name,' . $subjectGroup->id,
            'is_active' => 'sometimes|boolean',
        ], [
            'name.required' => 'Subject group name is required.',
            'name.unique' => 'A subject group with this name already exists.',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        $subjectGroup->update($validated);

        return back()->with('success', 'Subject group updated.');
    }

    public function destroy(SubjectGroup $subjectGroup)
    {
        if ($subjectGroup->classSectionGroups()->exists()) {
            return back()->with('error', 'Cannot delete: this subject group is in use by class section groups.');
        }
        $subjectGroup->delete();

        return back()->with('success', 'Subject group deleted.');
    }
}
