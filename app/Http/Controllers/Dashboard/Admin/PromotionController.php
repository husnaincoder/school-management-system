<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\Promotion;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Services\Student\StudentRollNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromotionController extends Controller
{
    public function index(Request $request)
    {
        $query = Promotion::with([
            'student.user',
            'fromEnrollment.classSectionGroup.classSection.academicSession',
            'fromEnrollment.classSectionGroup.classSection.class',
            'fromEnrollment.classSectionGroup.classSection.section',
            'fromEnrollment.classSectionGroup.subjectGroup',
            'toClassSectionGroup.classSection.academicSession',
            'toClassSectionGroup.classSection.class',
            'toClassSectionGroup.classSection.section',
            'toClassSectionGroup.subjectGroup',
            'promotedByUser',
        ]);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->filled('class_section_group_id')) {
            $query->where('to_class_section_group_id', $request->class_section_group_id);
        }

        $promotions = $query->orderBy('promotion_date', 'desc')->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(15);

        $classSectionGroups = $this->classSectionGroups();

        $filterStudents = Student::with('user')
            ->whereHas('promotions')
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->full_name ?: $s->user?->name ?: "Student #{$s->id}"]);

        return inertia('dashboard/academic/Promotions', [
            'promotions' => $promotions,
            'classSectionGroups' => $classSectionGroups,
            'filterStudents' => $filterStudents,
            'filters' => $request->only(['student_id', 'class_section_group_id']),
        ]);
    }

    public function create()
    {
        return inertia('dashboard/academic/PromotionCreate', [
            'enrollments' => $this->enrollments(),
            'classSectionGroups' => $this->classSectionGroups(),
        ]);
    }

    public function edit(Promotion $promotion)
    {
        $promotion->load([
            'student.user',
            'student.enrollment',
            'fromEnrollment.classSectionGroup.classSection.academicSession',
            'fromEnrollment.classSectionGroup.classSection.class',
            'fromEnrollment.classSectionGroup.classSection.section',
            'fromEnrollment.classSectionGroup.subjectGroup',
            'toClassSectionGroup.classSection.academicSession',
            'toClassSectionGroup.classSection.class',
            'toClassSectionGroup.classSection.section',
            'toClassSectionGroup.subjectGroup',
            'promotedByUser',
        ]);

        return inertia('dashboard/academic/PromotionEdit', [
            'promotion' => $promotion,
            'classSectionGroups' => $this->classSectionGroups(),
        ]);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'to_class_section_group_id' => 'required|exists:class_section_groups,id',
            'promotion_date' => 'nullable|date',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $promotion->load('student.enrollment');
        $enrollment = $promotion->student?->enrollment;
        $oldToGroupId = (int) $promotion->to_class_section_group_id;
        $newToGroupId = (int) $validated['to_class_section_group_id'];
        $promotionDate = $validated['promotion_date'] ?? $promotion->promotion_date?->toDateString() ?? now()->toDateString();

        try {
            DB::transaction(function () use ($promotion, $enrollment, $oldToGroupId, $newToGroupId, $promotionDate, $validated) {
                if ($enrollment && $oldToGroupId !== $newToGroupId) {
                    $toGroup = ClassSectionGroup::with(
                        'classSection.class',
                        'classSection.section',
                        'classSection.academicSession',
                        'subjectGroup'
                    )->findOrFail($newToGroupId);

                    $newRollNumber = StudentRollNumberService::nextForGroup($toGroup);

                    $enrollment->update([
                        'class_section_group_id' => $toGroup->id,
                        'roll_number' => $newRollNumber,
                        'admission_date' => $promotionDate,
                        'status' => 'active',
                    ]);

                    Student::where('id', $enrollment->student_id)->update([
                        'admission_number' => $newRollNumber,
                    ]);
                } elseif ($enrollment && ! empty($validated['promotion_date'])) {
                    $enrollment->update(['admission_date' => $promotionDate]);
                }

                $promotion->update([
                    'to_class_section_group_id' => $newToGroupId,
                    'promotion_date' => $promotionDate,
                    'remarks' => $validated['remarks'] ?? null,
                ]);
            });
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('academic.promotions')->with('success', 'Promotion updated successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_enrollment_id' => 'required|exists:student_enrollments,id',
            'to_class_section_group_id' => 'required|exists:class_section_groups,id',
            'promotion_date' => 'nullable|date',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $enrollment = StudentEnrollment::findOrFail($validated['from_enrollment_id']);
        $promotionDate = $validated['promotion_date'] ?? now()->toDateString();

        try {
            DB::transaction(function () use ($enrollment, $validated, $request, $promotionDate) {
                $this->promoteEnrollment(
                    $enrollment,
                    (int) $validated['to_class_section_group_id'],
                    $request->user()->id,
                    $promotionDate,
                    $validated['remarks'] ?? null
                );
            });
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Student promoted and enrollment updated successfully.');
    }

    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'from_class_section_group_id' => 'required|exists:class_section_groups,id',
            'to_class_section_group_id' => 'required|exists:class_section_groups,id|different:from_class_section_group_id',
            'promotion_date' => 'nullable|date',
            'remarks' => 'nullable|string|max:2000',
            'students' => 'required|array|min:1',
            'students.*.enrollment_id' => 'required|exists:student_enrollments,id',
            'students.*.result' => 'required|in:pass,fail',
        ]);

        $promotionDate = $validated['promotion_date'] ?? now()->toDateString();
        $passStudents = collect($validated['students'])->where('result', 'pass')->values();

        if ($passStudents->isEmpty()) {
            return back()->with('error', 'Select at least one student as Pass (Promote).');
        }

        $promoted = 0;
        $retained = collect($validated['students'])->where('result', 'fail')->count();

        try {
            DB::transaction(function () use ($validated, $request, $promotionDate, $passStudents, &$promoted) {
                foreach ($passStudents as $row) {
                    $enrollment = StudentEnrollment::where('id', $row['enrollment_id'])
                        ->where('class_section_group_id', $validated['from_class_section_group_id'])
                        ->firstOrFail();

                    $this->promoteEnrollment(
                        $enrollment,
                        (int) $validated['to_class_section_group_id'],
                        $request->user()->id,
                        $promotionDate,
                        $validated['remarks'] ?? null
                    );

                    $promoted++;
                }
            });
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('academic.promotions')->with('success', "{$promoted} student(s) promoted. {$retained} student(s) retained in the same class.");
    }

    private function enrollments()
    {
        return StudentEnrollment::with([
            'student.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])->orderBy('student_id')->get();
    }

    private function classSectionGroups()
    {
        return ClassSectionGroup::with(
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->orderBy('class_section_id')->orderBy('subject_group_id')->get();
    }

    private function promoteEnrollment(
        StudentEnrollment $enrollment,
        int $toClassSectionGroupId,
        int $promotedBy,
        string $promotionDate,
        ?string $remarks
    ): void {
        if ((int) $enrollment->class_section_group_id === $toClassSectionGroupId) {
            throw new \InvalidArgumentException('From and to group cannot be the same.');
        }

        $toGroup = ClassSectionGroup::with(
            'classSection.class',
            'classSection.section',
            'classSection.academicSession',
            'subjectGroup'
        )->findOrFail($toClassSectionGroupId);

        $newRollNumber = StudentRollNumberService::nextForGroup($toGroup);

        Promotion::create([
            'student_id' => $enrollment->student_id,
            'from_enrollment_id' => $enrollment->id,
            'to_class_section_group_id' => $toGroup->id,
            'promoted_by' => $promotedBy,
            'promotion_date' => $promotionDate,
            'remarks' => $remarks,
        ]);

        $enrollment->update([
            'class_section_group_id' => $toGroup->id,
            'roll_number' => $newRollNumber,
            'admission_date' => $promotionDate,
            'status' => 'active',
        ]);

        Student::where('id', $enrollment->student_id)->update([
            'admission_number' => $newRollNumber,
        ]);
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->delete();
        return back()->with('success', 'Promotion record removed.');
    }
}
