<?php

namespace App\Http\Controllers\Dashboard\Parent;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\LeaveDay;
use App\Models\LeaveType;
use App\Models\ParentModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentLeaveApplicationController extends Controller
{
    protected function getParentEnrollmentIds(): \Illuminate\Support\Collection
    {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        if (! $parent) {
            return collect();
        }

        return $parent->students()
            ->with('enrollments')
            ->get()
            ->pluck('enrollments')
            ->flatten()
            ->pluck('id')
            ->unique()
            ->filter()
            ->values();
    }

    protected function authorizeLeave(Leave $leave): void
    {
        $enrollmentIds = $this->getParentEnrollmentIds();
        if (! $leave->student_enrollment_id || ! $enrollmentIds->contains($leave->student_enrollment_id)) {
            abort(403, 'You can only access leave applications for your own children.');
        }
    }

    public function index(Request $request)
    {
        $enrollmentIds = $this->getParentEnrollmentIds();
        if ($enrollmentIds->isEmpty()) {
            return Inertia::render('dashboard/parent/LeaveApplicationsIndex', [
                'applications' => [],
                'filters' => ['status' => ''],
            ]);
        }

        $status = $request->input('status');

        $query = Leave::with([
            'leaveType',
            'studentEnrollment.student.user',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
            'leaveApprovals.approver',
        ])
            ->whereIn('student_enrollment_id', $enrollmentIds->all())
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $status);
        }

        $applications = $query->paginate(15)->withQueryString();

        return Inertia::render('dashboard/parent/LeaveApplicationsIndex', [
            'applications' => $applications,
            'filters' => ['status' => $status ?? ''],
        ]);
    }

    public function create()
    {
        $parent = ParentModel::where('user_id', Auth::id())->with('students.enrollment.classSectionGroup.classSection.class', 'students.enrollment.classSectionGroup.classSection.section')->first();
        if (! $parent) {
            abort(404, 'Parent profile not found.');
        }

        $leaveTypes = LeaveType::where('for_students', true)->orderBy('name')->get();
        if ($leaveTypes->isEmpty()) {
            $leaveTypes = LeaveType::orderBy('name')->get();
        }

        $children = $parent->students->map(function ($student) {
            $en = $student->enrollment;
            if (! $en) {
                return null;
            }
            $csg = $en->classSectionGroup;
            $cs = $csg?->classSection;
            $classLabel = trim(($cs?->class?->name ?? '') . ' ' . ($cs?->section?->name ?? '')) ?: '—';
            return [
                'id' => $student->id,
                'name' => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')),
                'user' => $student->user ? ['name' => $student->user->name] : null,
                'enrollment' => [
                    'id' => $en->id,
                    'class_section_group_id' => $en->class_section_group_id,
                    'class_label' => $classLabel,
                ],
            ];
        })->filter(fn ($c) => $c !== null)->values()->all();

        if (empty($children)) {
            return redirect()->route('parent.leave-applications.index')->with('error', 'No child with active enrollment found. Cannot apply for leave.');
        }

        return Inertia::render('dashboard/parent/LeaveApplicationCreate', [
            'children' => $children,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function store(Request $request)
    {
        $enrollmentIds = $this->getParentEnrollmentIds();
        $request->validate([
            'student_enrollment_id' => 'required|integer|in:' . $enrollmentIds->implode(','),
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $enrollmentId = (int) $request->input('student_enrollment_id');
        $start = Carbon::parse($request->input('start_date'));
        $end = Carbon::parse($request->input('end_date'));
        $totalDays = $start->diffInDays($end) + 1;

        $leave = Leave::create([
            'leave_type_id' => $request->input('leave_type_id'),
            'student_enrollment_id' => $enrollmentId,
            'teacher_id' => null,
            'employee_id' => null,
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'total_days' => $totalDays,
            'reason' => $request->input('reason'),
            'status' => Leave::STATUS_PENDING,
        ]);

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            LeaveDay::create([
                'leave_id' => $leave->id,
                'leave_date' => $d->format('Y-m-d'),
                'is_half_day' => false,
            ]);
        }

        return redirect()->route('parent.leave-applications.show', $leave->id)->with('success', 'Leave application submitted successfully.');
    }

    public function show(Leave $leave)
    {
        $this->authorizeLeave($leave);

        $leave->load([
            'leaveType',
            'studentEnrollment.student.user',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
            'leaveApprovals.approver',
        ]);

        $approvedByUser = $leave->leaveApprovals->first()?->approver;

        $application = [
            'id' => $leave->id,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'total_days' => $leave->total_days,
            'reason' => $leave->reason,
            'status' => $leave->status,
            'leave_type' => $leave->leaveType ? ['id' => $leave->leaveType->id, 'name' => $leave->leaveType->name] : null,
            'student_enrollment' => $leave->studentEnrollment ? [
                'id' => $leave->studentEnrollment->id,
                'student' => $leave->studentEnrollment->student,
                'class_section_group' => $leave->studentEnrollment->classSectionGroup,
            ] : null,
            'approved_by_user' => $approvedByUser ? ['name' => $approvedByUser->name] : null,
            'approved_at' => $leave->leaveApprovals->first()?->approved_at?->format('c'),
            'remarks' => $leave->leaveApprovals->first()?->note,
        ];

        return Inertia::render('dashboard/parent/LeaveApplicationShow', [
            'application' => $application,
        ]);
    }

    public function edit(Leave $leave)
    {
        $this->authorizeLeave($leave);

        if ($leave->status !== Leave::STATUS_PENDING) {
            return redirect()->route('parent.leave-applications.show', $leave->id)->with('error', 'Only pending applications can be edited.');
        }

        $leave->load([
            'leaveType',
            'studentEnrollment.student.user',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
        ]);

        $en = $leave->studentEnrollment;
        $student = $en?->student;
        $csg = $en?->classSectionGroup;
        $cs = $csg?->classSection;

        $child = [
            'id' => $student?->id,
            'name' => trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')),
            'enrollment' => [
                'id' => $leave->student_enrollment_id,
                'class_section_group_id' => $csg?->id,
                'class_label' => trim(($cs?->class?->name ?? '') . ' ' . ($cs?->section?->name ?? '')) ?: '—',
            ],
        ];

        $application = [
            'id' => $leave->id,
            'leave_type_id' => $leave->leave_type_id,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'reason' => $leave->reason,
            'status' => $leave->status,
        ];

        return Inertia::render('dashboard/parent/LeaveApplicationEdit', [
            'application' => $application,
            'child' => $child,
            'leaveTypes' => LeaveType::where('for_students', true)->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Leave $leave)
    {
        $this->authorizeLeave($leave);

        if ($leave->status !== Leave::STATUS_PENDING) {
            return back()->with('error', 'Only pending applications can be updated.');
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $start = Carbon::parse($request->input('start_date'));
        $end = Carbon::parse($request->input('end_date'));
        $totalDays = $start->diffInDays($end) + 1;

        $leave->update([
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'total_days' => $totalDays,
            'reason' => $request->input('reason'),
        ]);

        $leave->leaveDays()->delete();
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            LeaveDay::create([
                'leave_id' => $leave->id,
                'leave_date' => $d->format('Y-m-d'),
                'is_half_day' => false,
            ]);
        }

        return redirect()->route('parent.leave-applications.show', $leave->id)->with('success', 'Leave application updated successfully.');
    }
}
