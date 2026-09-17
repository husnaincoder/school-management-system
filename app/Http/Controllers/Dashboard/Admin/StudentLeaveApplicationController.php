<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\Leave;
use App\Models\LeaveApproval;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentLeaveApplicationController extends Controller
{
    /**
     * List all student leave applications (Leave model, parent-applied) for Admin/Super Admin.
     */
    public function index(Request $request)
    {
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
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $status);
        }
        if ($request->filled('class_section_group_id')) {
            $query->whereHas('studentEnrollment', fn ($q) => $q->where('class_section_group_id', $classSectionGroupId));
        }

        $applications = $query->paginate(15)->withQueryString();

        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section', 'subjectGroup')
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

        return Inertia::render('dashboard/admin/StudentLeaveApplicationsIndex', [
            'applications' => $applications,
            'classSectionGroups' => $classSectionGroups,
            'filters' => [
                'status' => $status ?? '',
                'class_section_group_id' => $classSectionGroupId ?? '',
            ],
        ]);
    }

    /**
     * Approve a student leave (Admin/Super Admin).
     */
    public function approve(Request $request, Leave $leave)
    {
        if (! $leave->student_enrollment_id) {
            abort(404, 'Not a student leave.');
        }

        if ($leave->status !== 'pending') {
            return back()->with('error', 'This application is already processed.');
        }

        $leave->update(['status' => 'approved']);
        LeaveApproval::create([
            'leave_id' => $leave->id,
            'approved_by' => $request->user()->id,
            'status' => LeaveApproval::STATUS_APPROVED,
            'note' => $request->input('remarks'),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Leave approved.');
    }

    /**
     * Reject a student leave (Admin/Super Admin).
     */
    public function reject(Request $request, Leave $leave)
    {
        if (! $leave->student_enrollment_id) {
            abort(404, 'Not a student leave.');
        }

        if ($leave->status !== 'pending') {
            return back()->with('error', 'This application is already processed.');
        }

        $leave->update(['status' => 'rejected']);
        LeaveApproval::create([
            'leave_id' => $leave->id,
            'approved_by' => $request->user()->id,
            'status' => LeaveApproval::STATUS_REJECTED,
            'note' => $request->input('remarks'),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Leave rejected.');
    }
}
