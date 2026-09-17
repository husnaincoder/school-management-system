<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\SchoolClass;
use App\Models\Section;
use Illuminate\Http\Request;

class ClassSectionController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassSection::with('academicSession', 'class', 'section');
        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->academic_session_id);
        }
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        $classSections = $query->orderBy('academic_session_id')->orderBy('class_id')->get();
        $sessionsList = AcademicSession::orderBy('start_date', 'desc')->get();
        $classes = SchoolClass::where('is_active', true)->get();
        $sections = Section::where('is_active', true)->get();
        return inertia('dashboard/academic/ClassSections', [
            'classSections' => $classSections,
            'academicSessions' => $sessionsList,
            'sessionsList' => $sessionsList,
            'classes' => $classes,
            'sections' => $sections,
            'filterSessionId' => $request->academic_session_id,
            'filterClassId' => $request->class_id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_id' => 'required|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');
        $validated['capacity'] = $validated['capacity'] ?? 40;
        ClassSection::create($validated);
        return back()->with('success', 'Class section created.');
    }

    public function update(Request $request, ClassSection $classSection)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_id' => 'required|exists:classes,id',
            'section_id' => 'nullable|exists:sections,id',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');
        $validated['capacity'] = $validated['capacity'] ?? 40;
        $classSection->update($validated);
        return back()->with('success', 'Class section updated.');
    }

    public function destroy(ClassSection $classSection)
    {
        $classSection->delete();
        return back()->with('success', 'Class section deleted.');
    }
}
