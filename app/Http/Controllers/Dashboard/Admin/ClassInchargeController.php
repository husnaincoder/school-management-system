<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassIncharge;
use App\Models\ClassSection;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClassInchargeController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'super_admin']), 403);

        $query = ClassIncharge::with([
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'teacher.user',
        ]);

        if ($request->filled('class_section_id')) {
            $query->where('class_section_id', $request->class_section_id);
        }

        $incharges = $query->latest()->get();

        $classSections = ClassSection::with(['academicSession', 'class', 'section'])
            ->where('is_active', true)
            ->orderByDesc('academic_session_id')
            ->orderBy('class_id')
            ->get()
            ->map(fn (ClassSection $cs) => [
                'id' => $cs->id,
                'name' => trim(
                    ($cs->academicSession?->name ?? '').' · '.
                    ($cs->class?->name ?? '').' - '.
                    ($cs->section?->name ?? '')
                ),
            ]);

        $teachers = Teacher::with('user')->orderBy('staff_id')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->user?->name ?? $t->staff_id ?? 'Teacher #'.$t->id,
            'staff_id' => $t->staff_id,
        ]);

        return inertia('dashboard/academic/ClassIncharges', [
            'incharges' => $incharges,
            'classSections' => $classSections,
            'teachers' => $teachers,
            'filterClassSectionId' => $request->class_section_id,
        ]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'super_admin']), 403);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'teacher_id' => [
                'required',
                'exists:teachers,id',
                Rule::unique('class_incharges', 'teacher_id')->where(fn ($q) => $q->where('class_section_id', $request->class_section_id)),
            ],
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');

        DB::transaction(function () use ($validated) {
            if ($validated['is_active']) {
                // Prefer one active incharge per class section.
                ClassIncharge::where('class_section_id', $validated['class_section_id'])
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }
            ClassIncharge::create($validated);
        });

        return back()->with('success', 'Class incharge assigned.');
    }

    public function update(Request $request, ClassIncharge $classIncharge)
    {
        abort_unless($request->user()?->hasAnyRole(['admin', 'super_admin']), 403);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'teacher_id' => [
                'required',
                'exists:teachers,id',
                Rule::unique('class_incharges', 'teacher_id')
                    ->where(fn ($q) => $q->where('class_section_id', $request->class_section_id))
                    ->ignore($classIncharge->id),
            ],
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');

        DB::transaction(function () use ($validated, $classIncharge) {
            if ($validated['is_active']) {
                ClassIncharge::where('class_section_id', $validated['class_section_id'])
                    ->where('is_active', true)
                    ->where('id', '!=', $classIncharge->id)
                    ->update(['is_active' => false]);
            }
            $classIncharge->update($validated);
        });

        return back()->with('success', 'Class incharge updated.');
    }

    public function destroy(ClassIncharge $classIncharge)
    {
        abort_unless(request()->user()?->hasAnyRole(['admin', 'super_admin']), 403);

        $classIncharge->delete();

        return back()->with('success', 'Class incharge removed.');
    }
}
