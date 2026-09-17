<?php

namespace App\Http\Controllers\Dashboard\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\Leave;
use App\Models\LeaveApproval;
use App\Services\Attendance\AttendanceSessionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentLeaveApplicationController extends Controller
{
    public function __construct(
        protected AttendanceSessionService $sessionService
    ) {}

    /**
     * List student leave applications (Leave model) for class incharge's assigned classes only.
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
            return Inertia::render('dashboard/teacher/LeaveApplicationsIndex', [
                'applications' => ['data' => [], 'links' => []],
                'classSectionGroups' => [],
                'filters' => ['status' => '', 'class_section_group_id' => ''],
            ]);
        }

        $status = $request->input('status');
        $classSectionGroupId = $request->input('class_section_group_id');

        $query = Leave::with([
            'leaveType',
            'studentEnrollment.student.user',
            'studentEnrollment.student.parent.user',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
            'studentEnrollment.classSectionGroup.subjectGroup',
            'leaveApprovals.approver',
        ])
            ->whereNotNull('student_enrollment_id')
            ->whereHas('studentEnrollment', fn ($q) => $q->whereIn('class_section_group_id', $allowedGroupIds->all()));

        if ($request->filled('status')) {
            $query->where('status', $status);
        }
        if ($request->filled('class_section_group_id')) {
            $query->whereHas('studentEnrollment', fn ($q) => $q->where('class_section_group_id', $classSectionGroupId));
        }

        $applications = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

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

        return Inertia::render('dashboard/teacher/LeaveApplicationsIndex', [
            'applications' => $applications,
            'classSectionGroups' => $classSectionGroups,
            'filters' => [
                'status' => $status ?? '',
                'class_section_group_id' => $classSectionGroupId ?? '',
            ],
        ]);
    }

    /**
     * Approve a student leave (class incharge only for their class).
     */
    public function approve(Request $request, Leave $leave)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return back()->with('error', 'Teacher profile not found.');
        }

        if (! $leave->student_enrollment_id) {
            abort(404, 'Not a student leave.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        $enrollment = $leave->studentEnrollment;
        if (! $enrollment || ! $allowedGroupIds->contains($enrollment->class_section_group_id)) {
            abort(403, 'You can only approve leave for your incharge class.');
        }

        if ($leave->status !== 'pending') {
            return back()->with('error', 'This application is already processed.');
        }

        $leave->update(['status' => 'approved']);
        LeaveApproval::create([
            'leave_id' => $leave->id,
            'approved_by' => $user->id,
            'status' => LeaveApproval::STATUS_APPROVED,
            'note' => $request->input('remarks'),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Leave approved.');
    }

    /**
     * Reject a student leave (class incharge only for their class).
     */
    public function reject(Request $request, Leave $leave)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return back()->with('error', 'Teacher profile not found.');
        }

        if (! $leave->student_enrollment_id) {
            abort(404, 'Not a student leave.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        $enrollment = $leave->studentEnrollment;
        if (! $enrollment || ! $allowedGroupIds->contains($enrollment->class_section_group_id)) {
            abort(403, 'You can only reject leave for your incharge class.');
        }

        if ($leave->status !== 'pending') {
            return back()->with('error', 'This application is already processed.');
        }

        $leave->update(['status' => 'rejected']);
        LeaveApproval::create([
            'leave_id' => $leave->id,
            'approved_by' => $user->id,
            'status' => LeaveApproval::STATUS_REJECTED,
            'note' => $request->input('remarks'),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Leave rejected.');
    }
}
