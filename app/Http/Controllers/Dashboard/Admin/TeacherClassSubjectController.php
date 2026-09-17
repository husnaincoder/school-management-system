<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\Subject;
use App\Models\TeacherClassSubject;
use App\Models\User;
use Illuminate\Http\Request;

class TeacherClassSubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = TeacherClassSubject::with('academicSession', 'classSection.class', 'classSection.section', 'teacher', 'subject');
        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->academic_session_id);
        }
        if ($request->filled('class_section_id')) {
            $query->where('class_section_id', $request->class_section_id);
        }
        $assignments = $query->latest()->get();
        $sessions = AcademicSession::orderBy('start_date', 'desc')->get();
        $classSections = ClassSection::with('class', 'section', 'academicSession')
            ->when($request->filled('academic_session_id'), fn($q) => $q->where('academic_session_id', $request->academic_session_id))
            ->get();
        $teachers = User::role('teacher')->orderBy('name')->get();
        $subjects = Subject::where('is_active', true)->orderBy('name')->get();
        return inertia('dashboard/academic/TeacherClassSubjects', [
            'assignments' => $assignments,
            'sessions' => $sessions,
            'classSections' => $classSections,
            'teachers' => $teachers,
            'subjects' => $subjects,
            'filterSessionId' => $request->academic_session_id,
            'filterClassSectionId' => $request->class_section_id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_section_id' => 'required|exists:class_sections,id',
            'teacher_id' => 'required|exists:users,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);
        TeacherClassSubject::create($validated);
        return back()->with('success', 'Teacher assigned to subject.');
    }

    public function update(Request $request, TeacherClassSubject $teacherClassSubject)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_section_id' => 'required|exists:class_sections,id',
            'teacher_id' => 'required|exists:users,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);
        $teacherClassSubject->update($validated);
        return back()->with('success', 'Assignment updated.');
    }

    public function destroy(TeacherClassSubject $teacherClassSubject)
    {
        $teacherClassSubject->delete();
        return back()->with('success', 'Assignment removed.');
    }
}
