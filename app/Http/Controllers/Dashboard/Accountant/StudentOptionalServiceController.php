<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\FeeType;
use App\Models\StudentEnrollment;
use App\Models\StudentOptionalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentOptionalServiceController extends Controller
{
    private function formatClassSectionGroup(ClassSectionGroup $group): array
    {
        $parts = [];
        $cs = $group->classSection;
        if ($cs && $cs->academicSession) {
            $parts[] = $cs->academicSession->name;
        }
        if ($cs && $cs->class) {
            $parts[] = $cs->class->name;
        }
        if ($cs && $cs->section) {
            $parts[] = $cs->section->name;
        }
        if ($group->subjectGroup) {
            $parts[] = $group->subjectGroup->name;
        }
        $name = $parts ? implode(' · ', $parts) : 'Group #' . $group->id;
        return ['id' => $group->id, 'name' => $name];
    }

    private function enrollmentLabel(StudentEnrollment $en): string
    {
        $student = $en->student;
        $label = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : '-';
        if ($en->roll_number !== null && $en->roll_number !== '') {
            $label .= ' (Roll: ' . $en->roll_number . ')';
        }
        return $label;
    }

    public function index(Request $request)
    {
        $query = StudentOptionalService::with([
            'studentEnrollment.student',
            'studentEnrollment.classSectionGroup.classSection.academicSession',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
            'studentEnrollment.classSectionGroup.subjectGroup',
            'feeType',
        ]);

        if ($request->filled('class_section_group_id')) {
            $query->whereHas('studentEnrollment', fn ($q) => $q->where('class_section_group_id', $request->class_section_group_id));
        }

        $services = $query->latest('id')->paginate(15)->through(function (StudentOptionalService $row) {
            $en = $row->studentEnrollment;
            $csg = $en ? $en->classSectionGroup : null;
            $session = $csg && $csg->classSection && $csg->classSection->academicSession
                ? $csg->classSection->academicSession->name : '—';
            $class = $csg && $csg->classSection && $csg->classSection->class
                ? $csg->classSection->class->name : '—';
            $section = $csg && $csg->classSection && $csg->classSection->section
                ? $csg->classSection->section->name : '—';
            return [
                'id' => $row->id,
                'student_enrollment_id' => $row->student_enrollment_id,
                'fee_type_id' => $row->fee_type_id,
                'amount' => $row->amount,
                'enrollment_label' => $en ? $this->enrollmentLabel($en) : '—',
                'session' => $session,
                'class' => $class,
                'section' => $section,
                'class_section_group_id' => $en ? $en->class_section_group_id : null,
                'fee_type' => $row->feeType ? ['id' => $row->feeType->id, 'name' => $row->feeType->name] : null,
            ];
        });

        $classSectionGroups = ClassSectionGroup::with([
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup',
        ])->get()->map(fn (ClassSectionGroup $g) => $this->formatClassSectionGroup($g));

        $enrollments = StudentEnrollment::with([
            'student',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])->get()->map(function (StudentEnrollment $en) {
            return [
                'id' => (int) $en->id,
                'name' => $this->enrollmentLabel($en),
                'class_section_group_id' => (int) $en->class_section_group_id,
            ];
        });

        $feeTypes = FeeType::orderBy('name')->get(['id', 'name']);

        return Inertia::render('dashboard/fee/StudentOptionalServices', [
            'services' => $services,
            'classSectionGroups' => $classSectionGroups,
            'enrollments' => $enrollments,
            'feeTypes' => $feeTypes,
            'filterClassSectionGroupId' => $request->get('class_section_group_id', ''),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'amount' => 'required|numeric|min:0',
        ], [
            'student_enrollment_id.required' => 'Please select a student.',
            'fee_type_id.required' => 'Please select a fee type.',
            'amount.required' => 'Amount is required.',
        ]);

        StudentOptionalService::create($validated);

        return back()->with('success', 'Optional service added.');
    }

    public function update(Request $request, StudentOptionalService $studentOptionalService)
    {
        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'amount' => 'required|numeric|min:0',
        ], [
            'student_enrollment_id.required' => 'Please select a student.',
            'fee_type_id.required' => 'Please select a fee type.',
            'amount.required' => 'Amount is required.',
        ]);

        $studentOptionalService->update($validated);

        return back()->with('success', 'Optional service updated.');
    }

    public function destroy(StudentOptionalService $studentOptionalService)
    {
        $studentOptionalService->delete();
        return back()->with('success', 'Optional service removed.');
    }
}
