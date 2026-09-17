<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\ClassSection;
use App\Models\SubjectGroup;
use App\Models\AcademicSession;
use Illuminate\Http\Request;

class ClassSectionGroupController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassSectionGroup::with('classSection.academicSession', 'classSection.class', 'classSection.section', 'subjectGroup');

        if ($request->filled('academic_session_id')) {
            $query->whereHas('classSection', fn ($q) => $q->where('academic_session_id', $request->academic_session_id));
        }
        if ($request->filled('class_section_id')) {
            $query->where('class_section_id', $request->class_section_id);
        }

        $classSectionGroups = $query->orderBy('class_section_id')->orderBy('subject_group_id')->get();

        $classSections = ClassSection::with('academicSession', 'class', 'section')
            ->orderBy('academic_session_id')->orderBy('class_id')->orderBy('section_id')
            ->get();
        $subjectGroups = SubjectGroup::where('is_active', true)->orderBy('name')->get();
        $sessions = AcademicSession::orderBy('start_date', 'desc')->get();

        return inertia('dashboard/academic/ClassSectionGroups', [
            'classSectionGroups' => $classSectionGroups,
            'classSections' => $classSections,
            'subjectGroups' => $subjectGroups,
            'sessions' => $sessions,
            'filterSessionId' => $request->academic_session_id,
            'filterClassSectionId' => $request->class_section_id,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'subject_group_id' => 'required|exists:subject_groups,id',
        ], [
            'class_section_id.required' => 'Class section is required.',
            'subject_group_id.required' => 'Subject group is required.',
        ]);

        if (ClassSectionGroup::where('class_section_id', $validated['class_section_id'])->where('subject_group_id', $validated['subject_group_id'])->exists()) {
            return back()->with('error', 'This class section already has this subject group.');
        }

        ClassSectionGroup::create($validated);
        return back()->with('success', 'Class section group created.');
    }

    public function update(Request $request, ClassSectionGroup $classSectionGroup)
    {
        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'subject_group_id' => 'required|exists:subject_groups,id',
        ], [
            'class_section_id.required' => 'Class section is required.',
            'subject_group_id.required' => 'Subject group is required.',
        ]);

        $exists = ClassSectionGroup::where('class_section_id', $validated['class_section_id'])
            ->where('subject_group_id', $validated['subject_group_id'])
            ->where('id', '!=', $classSectionGroup->id)
            ->exists();
        if ($exists) {
            return back()->with('error', 'This class section already has this subject group.');
        }

        $classSectionGroup->update($validated);
        return back()->with('success', 'Class section group updated.');
    }

    public function destroy(ClassSectionGroup $classSectionGroup)
    {
        if ($classSectionGroup->classSectionGroupSubjects()->exists()) {
            return back()->with('error', 'Cannot delete: this group has subjects assigned. Remove them first.');
        }
        $classSectionGroup->delete();
        return back()->with('success', 'Class section group deleted.');
    }
}
