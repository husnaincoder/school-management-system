<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSectionGroup;
use App\Models\ClassSectionGroupSubject;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;

class ClassSectionGroupSubjectController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassSectionGroupSubject::with(
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'subject',
            'teacher.user'
        );

        if ($request->filled('academic_session_id')) {
            $query->whereHas('classSectionGroup.classSection', fn ($q) => $q->where('academic_session_id', $request->academic_session_id));
        }
        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $request->class_section_group_id);
        }

        $classSectionGroupSubjects = $query->orderBy('class_section_group_id')->orderBy('subject_id')->get();

        $classSectionGroups = ClassSectionGroup::with('classSection.academicSession', 'classSection.class', 'classSection.section', 'subjectGroup')
            ->orderBy('class_section_id')->orderBy('subject_group_id')
            ->get();
        $subjects = Subject::where('is_active', true)->orderBy('name')->get();
        $teachers = Teacher::with('user')->orderBy('staff_id')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->user?->name ?? $t->staff_id ?? 'Teacher #' . $t->id,
            'staff_id' => $t->staff_id,
        ]);
        $sessions = AcademicSession::orderBy('start_date', 'desc')->get();

        return inertia('dashboard/academic/ClassSectionGroupSubjects', [
            'classSectionGroupSubjects' => $classSectionGroupSubjects,
            'classSectionGroups' => $classSectionGroups,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'sessions' => $sessions,
            'filterSessionId' => $request->academic_session_id,
            'filterClassSectionGroupId' => $request->class_section_group_id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'weekly_classes' => 'nullable|integer|min:0',
        ], [
            'class_section_group_id.required' => 'Class section group is required.',
            'subject_id.required' => 'Subject is required.',
        ]);

        if (ClassSectionGroupSubject::where('class_section_group_id', $validated['class_section_group_id'])
            ->where('subject_id', $validated['subject_id'])->exists()) {
            return back()->with('error', 'This subject is already assigned to this class section group.');
        }

        $validated['teacher_id'] = $request->filled('teacher_id') ? $validated['teacher_id'] : null;
        $validated['weekly_classes'] = $request->filled('weekly_classes') ? $validated['weekly_classes'] : null;
        ClassSectionGroupSubject::create($validated);
        return back()->with('success', 'Subject assigned successfully.');
    }

    public function update(Request $request, ClassSectionGroupSubject $classSectionGroupSubject)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'weekly_classes' => 'nullable|integer|min:0',
        ], [
            'class_section_group_id.required' => 'Class section group is required.',
            'subject_id.required' => 'Subject is required.',
        ]);

        $exists = ClassSectionGroupSubject::where('class_section_group_id', $validated['class_section_group_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('id', '!=', $classSectionGroupSubject->id)
            ->exists();
        if ($exists) {
            return back()->with('error', 'This subject is already assigned to this class section group.');
        }

        $validated['teacher_id'] = $request->filled('teacher_id') ? $validated['teacher_id'] : null;
        $validated['weekly_classes'] = $request->filled('weekly_classes') ? $validated['weekly_classes'] : null;
        $classSectionGroupSubject->update($validated);
        return back()->with('success', 'Assignment updated successfully.');
    }

    public function destroy(ClassSectionGroupSubject $classSectionGroupSubject)
    {
        $classSectionGroupSubject->delete();
        return back()->with('success', 'Subject assignment removed.');
    }
}
