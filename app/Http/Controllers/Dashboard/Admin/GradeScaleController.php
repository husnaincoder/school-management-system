<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeScale;
use Illuminate\Http\Request;

class GradeScaleController extends Controller
{
    public function index()
    {
        $gradeScales = GradeScale::orderBy('min_percentage', 'desc')->get();

        return inertia('dashboard/academic/GradeScales', [
            'gradeScales' => $gradeScales,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'grade' => 'required|string|max:10|unique:grade_scales,grade',
            'min_percentage' => 'required|numeric|min:0|max:100',
            'max_percentage' => 'required|numeric|min:0|max:100',
            'grade_point' => 'required|numeric|min:0',
        ], [
            'grade.required' => 'Grade is required.',
            'grade.unique' => 'This grade already exists.',
        ]);

        if ($validated['min_percentage'] > $validated['max_percentage']) {
            return back()->with('error', 'Min percentage cannot be greater than max percentage.');
        }

        GradeScale::create($validated);

        return back()->with('success', 'Grade scale created.');
    }

    public function update(Request $request, GradeScale $gradeScale)
    {
        $validated = $request->validate([
            'grade' => 'required|string|max:10|unique:grade_scales,grade,' . $gradeScale->id,
            'min_percentage' => 'required|numeric|min:0|max:100',
            'max_percentage' => 'required|numeric|min:0|max:100',
            'grade_point' => 'required|numeric|min:0',
        ], [
            'grade.required' => 'Grade is required.',
            'grade.unique' => 'This grade already exists.',
        ]);

        if ($validated['min_percentage'] > $validated['max_percentage']) {
            return back()->with('error', 'Min percentage cannot be greater than max percentage.');
        }

        $gradeScale->update($validated);

        return back()->with('success', 'Grade scale updated.');
    }

    public function destroy(GradeScale $gradeScale)
    {
        $gradeScale->delete();

        return back()->with('success', 'Grade scale deleted.');
    }
}
