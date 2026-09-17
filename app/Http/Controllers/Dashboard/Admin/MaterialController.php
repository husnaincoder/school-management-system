<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\ClassSectionGroupSubject;
use App\Models\StudentEnrollment;
use App\Support\UploadRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Material::with([
            'classSectionGroupSubject.classSectionGroup.classSection.class',
            'classSectionGroupSubject.classSectionGroup.classSection.section',
            'classSectionGroupSubject.classSectionGroup.subjectGroup',
            'classSectionGroupSubject.subject',
            'classSectionGroupSubject.teacher.user',
        ]);

        // Teacher: only materials for their assigned subjects
        if ($user->hasRole('teacher') && $user->teacher) {
            $teacherId = $user->teacher->id;
            $query->whereHas('classSectionGroupSubject', fn ($q) => $q->where('teacher_id', $teacherId));
        }

        // Student: only materials for their class section groups (enrollments)
        if ($user->hasRole('student') && $user->student) {
            $groupIds = StudentEnrollment::where('student_id', $user->student->id)->pluck('class_section_group_id');
            $query->whereHas('classSectionGroupSubject', fn ($q) => $q->whereIn('class_section_group_id', $groupIds));
        }

        // Parent: only materials for their children's class section groups
        if ($user->hasRole('parent') && $user->parent) {
            $studentIds = $user->parent->students()->pluck('id');
            $groupIds = StudentEnrollment::whereIn('student_id', $studentIds)->pluck('class_section_group_id')->unique();
            $query->whereHas('classSectionGroupSubject', fn ($q) => $q->whereIn('class_section_group_id', $groupIds));
        }

        if ($request->filled('class_section_group_subject_id')) {
            $query->where('class_section_group_subject_id', $request->class_section_group_subject_id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $materials = $query->latest()->get();

        // ClassSectionGroupSubjects: for dropdown when adding/editing. Teacher sees only their assigned; admin sees all; student/parent don't need (view only).
        $classSectionGroupSubjectsQuery = ClassSectionGroupSubject::with(
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'subject'
        )->orderBy('class_section_group_id')->orderBy('subject_id');

        if ($user->hasRole('teacher') && $user->teacher) {
            $classSectionGroupSubjectsQuery->where('teacher_id', $user->teacher->id);
        }

        $classSectionGroupSubjects = $classSectionGroupSubjectsQuery->get();

        $canEdit = $user->hasRole('admin') || $user->hasRole('super_admin') || $user->hasRole('teacher');

        return inertia('dashboard/material/Materials', [
            'materials' => $materials,
            'classSectionGroupSubjects' => $classSectionGroupSubjects,
            'filterClassSectionGroupSubjectId' => $request->class_section_group_subject_id,
            'filterType' => $request->type,
            'canEdit' => $canEdit,
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->user()->hasRole('admin') && ! $request->user()->hasRole('super_admin') && ! $request->user()->hasRole('teacher')) {
            abort(403, 'Only admin or teacher can add materials.');
        }
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:' . implode(',', Material::TYPES),
            'class_section_group_subject_id' => 'required|exists:class_section_group_subjects,id',
            'is_active' => 'boolean',
            'file' => UploadRules::documentFile(maxKilobytes: 20480),
        ]);

        // Teacher: can only create materials for their own assigned subjects
        if ($user->hasRole('teacher') && $user->teacher) {
            $teacherId = $user->teacher->id;
            $ownsSubject = ClassSectionGroupSubject::where('id', $validated['class_section_group_subject_id'])
                ->where('teacher_id', $teacherId)
                ->exists();

            if (! $ownsSubject) {
                abort(403, 'You are not allowed to add materials for this subject.');
            }
        }

        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('file')) {
            $validated['file_path'] = $request->file('file')->store('materials', 'public');
        } else {
            $validated['file_path'] = null;
        }

        unset($validated['file']);
        Material::create($validated);
        return back()->with('success', 'Material added successfully.');
    }

    public function update(Request $request, Material $material)
    {
        if (! $request->user()->hasRole('admin') && ! $request->user()->hasRole('super_admin') && ! $request->user()->hasRole('teacher')) {
            abort(403, 'Only admin or teacher can edit materials.');
        }
        $user = $request->user();

        // Teacher: can only edit materials for their own assigned subjects
        if ($user->hasRole('teacher') && $user->teacher) {
            $teacherId = $user->teacher->id;
            $material->loadMissing('classSectionGroupSubject');

            if (! $material->classSectionGroupSubject || $material->classSectionGroupSubject->teacher_id !== $teacherId) {
                abort(403, 'You are not allowed to edit this material.');
            }
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:' . implode(',', Material::TYPES),
            'class_section_group_subject_id' => 'required|exists:class_section_group_subjects,id',
            'is_active' => 'boolean',
            'file' => UploadRules::documentFile(maxKilobytes: 20480),
        ]);

        // Teacher: cannot move material to a subject they don't own
        if ($user->hasRole('teacher') && $user->teacher) {
            $teacherId = $user->teacher->id;
            $ownsSubject = ClassSectionGroupSubject::where('id', $validated['class_section_group_subject_id'])
                ->where('teacher_id', $teacherId)
                ->exists();

            if (! $ownsSubject) {
                abort(403, 'You are not allowed to assign this material to this subject.');
            }
        }

        $validated['is_active'] = $request->boolean('is_active');

        if ($request->hasFile('file')) {
            if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
                Storage::disk('public')->delete($material->file_path);
            }
            $validated['file_path'] = $request->file('file')->store('materials', 'public');
        }

        unset($validated['file']);
        $material->update($validated);
        return back()->with('success', 'Material updated successfully.');
    }

    public function destroy(Material $material)
    {
        if (! request()->user()->hasRole('admin') && ! request()->user()->hasRole('super_admin') && ! request()->user()->hasRole('teacher')) {
            abort(403, 'Only admin or teacher can delete materials.');
        }

        $user = request()->user();

        // Teacher: can only delete materials for their own assigned subjects
        if ($user->hasRole('teacher') && $user->teacher) {
            $teacherId = $user->teacher->id;
            $material->loadMissing('classSectionGroupSubject');

            if (! $material->classSectionGroupSubject || $material->classSectionGroupSubject->teacher_id !== $teacherId) {
                abort(403, 'You are not allowed to delete this material.');
            }
        }

        if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
            Storage::disk('public')->delete($material->file_path);
        }
        $material->delete();
        return back()->with('success', 'Material removed.');
    }

    public function download(Material $material)
    {
        if (!$material->file_path || !Storage::disk('public')->exists($material->file_path)) {
            return back()->with('error', 'File not found.');
        }

        $user = request()->user();

        // Teacher: can only download materials for their own assigned subjects
        if ($user->hasRole('teacher') && $user->teacher) {
            $teacherId = $user->teacher->id;
            $material->loadMissing('classSectionGroupSubject');

            if (! $material->classSectionGroupSubject || $material->classSectionGroupSubject->teacher_id !== $teacherId) {
                abort(403, 'You are not allowed to access this material.');
            }
        }

        $path = Storage::disk('public')->path($material->file_path);
        $name = $material->title . '.' . pathinfo($material->file_path, PATHINFO_EXTENSION);
        return response()->download($path, $name);
    }
}
