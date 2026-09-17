<?php

namespace App\Http\Controllers\Dashboard\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\StudentEnrollment;
use App\Models\StudentRemark;
use App\Services\Attendance\AttendanceSessionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentRemarkController extends Controller
{
    public function __construct(
        protected AttendanceSessionService $sessionService
    ) {}

    /**
     * List remarks for class incharge's assigned classes only.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        if ($allowedGroupIds->isEmpty()) {
            return Inertia::render('dashboard/teacher/RemarksIndex', [
                'remarks' => [],
                'classSectionGroups' => [],
                'filters' => ['class_section_group_id' => '', 'type' => ''],
            ]);
        }

        $classSectionGroupId = $request->input('class_section_group_id');
        $type = $request->input('type');

        $query = StudentRemark::with([
            'studentEnrollment.student.user',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
            'recordedByUser',
        ])
            ->whereIn('class_section_group_id', $allowedGroupIds->all());

        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $classSectionGroupId);
        }
        if ($request->filled('type')) {
            $query->where('type', $type);
        }

        $remarks = $query->orderByDesc('remark_date')->orderByDesc('created_at')->paginate(20)->withQueryString();

        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section', 'subjectGroup')
            ->whereIn('id', $allowedGroupIds->all())
            ->orderBy('id')
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'label' => trim(
                    ($g->classSection?->class?->name ?? '') . ' ' .
                    ($g->classSection?->section?->name ?? '') . ' ' .
                    ($g->subjectGroup?->name ?? '')
                ) ?: 'Group #' . $g->id,
            ]);

        return Inertia::render('dashboard/teacher/RemarksIndex', [
            'remarks' => $remarks,
            'classSectionGroups' => $classSectionGroups,
            'remarkTypes' => [
                ['value' => StudentRemark::TYPE_REMARK, 'label' => 'Remark'],
                ['value' => StudentRemark::TYPE_WARNING, 'label' => 'Warning'],
                ['value' => StudentRemark::TYPE_BEHAVIOR, 'label' => 'Behavior'],
                ['value' => StudentRemark::TYPE_PARENT_MEETING, 'label' => 'Parent Meeting'],
            ],
            'filters' => [
                'class_section_group_id' => $classSectionGroupId,
                'type' => $type,
            ],
        ]);
    }

    /**
     * Show form to add a new remark (incharge class students only).
     */
    public function create(Request $request)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        if ($allowedGroupIds->isEmpty()) {
            return redirect()->route('teacher.remarks.index')->with('error', 'No class assigned.');
        }

        $enrollments = StudentEnrollment::with('student.user', 'classSectionGroup.classSection.class', 'classSectionGroup.classSection.section')
            ->whereIn('class_section_group_id', $allowedGroupIds->all())
            ->orderBy('roll_number')
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'label' => ($e->student?->full_name ?? $e->student?->user?->name ?? '—') . ' (Roll: ' . ($e->roll_number ?? '—') . ')',
                'class_section_group_id' => $e->class_section_group_id,
            ]);

        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section', 'subjectGroup')
            ->whereIn('id', $allowedGroupIds->all())
            ->orderBy('id')
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'label' => trim(
                    ($g->classSection?->class?->name ?? '') . ' ' .
                    ($g->classSection?->section?->name ?? '') . ' ' .
                    ($g->subjectGroup?->name ?? '')
                ) ?: 'Group #' . $g->id,
            ]);

        return Inertia::render('dashboard/teacher/RemarksCreate', [
            'enrollments' => $enrollments,
            'classSectionGroups' => $classSectionGroups,
            'remarkTypes' => [
                ['value' => StudentRemark::TYPE_REMARK, 'label' => 'Remark'],
                ['value' => StudentRemark::TYPE_WARNING, 'label' => 'Warning'],
                ['value' => StudentRemark::TYPE_BEHAVIOR, 'label' => 'Behavior'],
                ['value' => StudentRemark::TYPE_PARENT_MEETING, 'label' => 'Parent Meeting'],
            ],
        ]);
    }

    /**
     * Store a new remark (only for incharge class student).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return back()->with('error', 'Teacher profile not found.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        if ($allowedGroupIds->isEmpty()) {
            return back()->with('error', 'No class assigned.');
        }

        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'type' => 'required|in:remark,warning,behavior,parent_meeting',
            'body' => 'required|string|max:5000',
            'remark_date' => 'nullable|date',
        ]);

        $enrollment = StudentEnrollment::findOrFail($validated['student_enrollment_id']);
        if (! $allowedGroupIds->contains($enrollment->class_section_group_id)) {
            abort(403, 'You can add remarks only for your incharge class students.');
        }

        $validated['class_section_group_id'] = $enrollment->class_section_group_id;
        $validated['recorded_by'] = $user->id;
        $validated['remark_date'] = $validated['remark_date'] ?? now()->toDateString();

        StudentRemark::create($validated);

        return redirect()->route('teacher.remarks.index')->with('success', 'Remark added.');
    }

    /**
     * Delete a remark (only if incharge for that class).
     */
    public function destroy(Request $request, StudentRemark $remark)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return back()->with('error', 'Teacher profile not found.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        if (! $remark->class_section_group_id || ! $allowedGroupIds->contains($remark->class_section_group_id)) {
            abort(403, 'You can delete only remarks for your incharge class.');
        }

        $remark->delete();
        return back()->with('success', 'Remark deleted.');
    }
}
