<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExamType;
use Illuminate\Http\Request;

class ExamTypeController extends Controller
{
    public function index()
    {
        $examTypes = ExamType::orderBy('name')->get();

        return inertia('dashboard/academic/ExamTypes', [
            'examTypes' => $examTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:exam_types,name',
        ], [
            'name.required' => 'Exam type name is required.',
            'name.unique' => 'An exam type with this name already exists.',
        ]);

        ExamType::create($validated);

        return back()->with('success', 'Exam type created.');
    }

    public function update(Request $request, ExamType $examType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:exam_types,name,' . $examType->id,
        ], [
            'name.required' => 'Exam type name is required.',
            'name.unique' => 'An exam type with this name already exists.',
        ]);

        $examType->update($validated);

        return back()->with('success', 'Exam type updated.');
    }

    public function destroy(ExamType $examType)
    {
        if ($examType->exams()->exists()) {
            return back()->with('error', 'Cannot delete: this exam type is in use by one or more exams.');
        }

        $examType->delete();

        return back()->with('success', 'Exam type deleted.');
    }
}
