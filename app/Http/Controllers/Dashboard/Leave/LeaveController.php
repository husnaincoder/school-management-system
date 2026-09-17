<?php

namespace App\Http\Controllers\Dashboard\Leave;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\LeaveType;
use App\Models\LeaveDay;
use App\Models\LeaveApproval;
use App\Models\LeaveBalance;
use App\Models\Teacher;
use App\Models\Employee;
use App\Models\StudentEnrollment;
use App\Models\AcademicSession;
use App\Services\Timetable\TimetableAdjustmentService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = Leave::with([
            'leaveType',
            'teacher.user',
            'employee.user',
            'studentEnrollment.student',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }
        if ($request->filled('from_date')) {
            $query->where('end_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->where('start_date', '<=', $request->to_date);
        }

        $leaves = $query->latest()->paginate(15)->withQueryString();
        $leaveTypes = LeaveType::orderBy('name')->get(['id', 'name']);

        return inertia('dashboard/leave/Leaves', [
            'leaves' => $leaves,
            'leaveTypes' => $leaveTypes,
            'filters' => $request->only(['status', 'leave_type_id', 'from_date', 'to_date']),
        ]);
    }

    public function create()
    {
        $leaveTypes = LeaveType::orderBy('name')->get();
        $teachers = Teacher::with('user:id,name')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->user?->name ?? 'Teacher #' . $t->id,
        ]);
        $employees = Employee::with('user:id,name')->get()->map(fn ($e) => [
            'id' => $e->id,
            'name' => $e->user?->name ?? 'Employee #' . $e->id,
        ]);
        $currentSession = AcademicSession::getCurrentSession();
        $enrollments = [];
        if ($currentSession) {
            $enrollments = StudentEnrollment::with(['student:id,first_name,last_name', 'classSectionGroup.classSection.class', 'classSectionGroup.classSection.section'])
                ->whereHas('classSectionGroup.classSection', fn ($q) => $q->where('academic_session_id', $currentSession->id))
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->student?->full_name ?? 'Enrollment #' . $e->id,
                    'class_section' => $e->classSectionGroup?->classSection
                        ? $e->classSectionGroup->classSection->class?->name . ' - ' . $e->classSectionGroup->classSection->section?->name
                        : '—',
                ]);
        }

        return inertia('dashboard/leave/LeaveForm', [
            'leaveTypes' => $leaveTypes,
            'teachers' => $teachers,
            'employees' => $employees,
            'enrollments' => $enrollments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'applicant_type' => 'required|in:student,teacher,employee',
            'student_enrollment_id' => 'nullable|required_if:applicant_type,student|exists:student_enrollments,id',
            'teacher_id' => 'nullable|required_if:applicant_type,teacher|exists:teachers,id',
            'employee_id' => 'nullable|required_if:applicant_type,employee|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $totalDays = $start->diffInDays($end) + 1;

        $leave = Leave::create([
            'leave_type_id' => $validated['leave_type_id'],
            'student_enrollment_id' => $validated['applicant_type'] === 'student' ? $validated['student_enrollment_id'] : null,
            'teacher_id' => $validated['applicant_type'] === 'teacher' ? $validated['teacher_id'] : null,
            'employee_id' => $validated['applicant_type'] === 'employee' ? $validated['employee_id'] : null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'total_days' => $totalDays,
            'reason' => $validated['reason'] ?? null,
            'status' => Leave::STATUS_PENDING,
        ]);

        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            LeaveDay::create([
                'leave_id' => $leave->id,
                'leave_date' => $d->format('Y-m-d'),
                'is_half_day' => false,
            ]);
        }

        return redirect()->route('leaves.index')->with('success', 'Leave application created.');
    }

    public function show(Leave $leaf)
    {
        $leave = $leaf;
        $leave->load([
            'leaveType',
            'leaveDays',
            'leaveApprovals.approver',
            'teacher.user',
            'employee.user',
            'studentEnrollment.student',
            'studentEnrollment.classSectionGroup.classSection.class',
            'studentEnrollment.classSectionGroup.classSection.section',
        ]);

        $enrollment = $leave->studentEnrollment;
        $csg = $enrollment?->classSectionGroup;
        $cs = $csg?->classSection;

        $teachers = Teacher::with('user:id,name')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->user?->name ?? 'Teacher #' . $t->id,
        ]);

        $payload = [
            'id' => $leave->id,
            'leave_type_id' => $leave->leave_type_id,
            'student_enrollment_id' => $leave->student_enrollment_id,
            'teacher_id' => $leave->teacher_id,
            'employee_id' => $leave->employee_id,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'total_days' => $leave->total_days,
            'reason' => $leave->reason,
            'status' => $leave->status,
            'leave_type' => $leave->leaveType ? [
                'id' => $leave->leaveType->id,
                'name' => $leave->leaveType->name,
                'is_paid' => $leave->leaveType->is_paid ?? null,
            ] : null,
            'student_enrollment' => $enrollment ? [
                'id' => $enrollment->id,
                'student' => $enrollment->student ? [
                    'id' => $enrollment->student->id,
                    'first_name' => $enrollment->student->first_name,
                    'last_name' => $enrollment->student->last_name,
                    'full_name' => $enrollment->student->full_name,
                ] : null,
                'class_section_group' => $csg ? [
                    'class_section' => $cs ? [
                        'class' => $cs->class ? ['id' => $cs->class->id, 'name' => $cs->class->name] : null,
                        'section' => $cs->section ? ['id' => $cs->section->id, 'name' => $cs->section->name] : null,
                    ] : null,
                ] : null,
            ] : null,
            'teacher' => $leave->teacher?->user ? [
                'id' => $leave->teacher->id,
                'user' => ['id' => $leave->teacher->user->id, 'name' => $leave->teacher->user->name],
            ] : null,
            'employee' => $leave->employee?->user ? [
                'id' => $leave->employee->id,
                'user' => ['id' => $leave->employee->user->id, 'name' => $leave->employee->user->name],
            ] : null,
            'leave_days' => $leave->leaveDays->map(fn ($d) => [
                'id' => $d->id,
                'leave_date' => $d->leave_date?->format('Y-m-d'),
                'is_half_day' => $d->is_half_day,
            ])->values()->all(),
            'leave_approvals' => $leave->leaveApprovals->map(fn ($a) => [
                'id' => $a->id,
                'status' => $a->status,
                'note' => $a->note,
                'approved_at' => $a->approved_at?->format('c'),
                'approver' => $a->approver ? ['id' => $a->approver->id, 'name' => $a->approver->name] : null,
            ])->values()->all(),
        ];

        return inertia('dashboard/leave/LeaveShow', [
            'leave' => $payload,
            'teachers' => $teachers,
        ]);
    }

    public function edit(Leave $leaf)
    {
        $leave = $leaf;
        if ($leave->status !== Leave::STATUS_PENDING) {
            return redirect()->route('leaves.show', $leave)->with('error', 'Only pending leaves can be edited.');
        }
        $leave->load(['leaveType', 'leaveDays']);
        $leaveTypes = LeaveType::orderBy('name')->get();
        $teachers = Teacher::with('user:id,name')->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? 'Teacher #' . $t->id]);
        $employees = Employee::with('user:id,name')->get()->map(fn ($e) => ['id' => $e->id, 'name' => $e->user?->name ?? 'Employee #' . $e->id]);
        $currentSession = AcademicSession::getCurrentSession();
        $enrollments = [];
        if ($currentSession) {
            $enrollments = StudentEnrollment::with(['student:id,first_name,last_name', 'classSectionGroup.classSection.class', 'classSectionGroup.classSection.section'])
                ->whereHas('classSectionGroup.classSection', fn ($q) => $q->where('academic_session_id', $currentSession->id))
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->student?->full_name ?? 'Enrollment #' . $e->id,
                    'class_section' => $e->classSectionGroup?->classSection
                        ? $e->classSectionGroup->classSection->class?->name . ' - ' . $e->classSectionGroup->classSection->section?->name
                        : '—',
                ]);
        }

        $leavePayload = [
            'id' => $leave->id,
            'leave_type_id' => $leave->leave_type_id,
            'student_enrollment_id' => $leave->student_enrollment_id,
            'teacher_id' => $leave->teacher_id,
            'employee_id' => $leave->employee_id,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'reason' => $leave->reason,
            'status' => $leave->status,
        ];

        return inertia('dashboard/leave/LeaveForm', [
            'leave' => $leavePayload,
            'leaveTypes' => $leaveTypes,
            'teachers' => $teachers,
            'employees' => $employees,
            'enrollments' => $enrollments,
            'isEdit' => true,
        ]);
    }

    public function update(Request $request, Leave $leaf)
    {
        $leave = $leaf;
        if ($leave->status !== Leave::STATUS_PENDING) {
            return redirect()->route('leaves.show', $leave)->with('error', 'Only pending leaves can be updated.');
        }
        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'applicant_type' => 'required|in:student,teacher,employee',
            'student_enrollment_id' => 'nullable|required_if:applicant_type,student|exists:student_enrollments,id',
            'teacher_id' => 'nullable|required_if:applicant_type,teacher|exists:teachers,id',
            'employee_id' => 'nullable|required_if:applicant_type,employee|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $totalDays = $start->diffInDays($end) + 1;

        $leave->update([
            'leave_type_id' => $validated['leave_type_id'],
            'student_enrollment_id' => $validated['applicant_type'] === 'student' ? $validated['student_enrollment_id'] : null,
            'teacher_id' => $validated['applicant_type'] === 'teacher' ? $validated['teacher_id'] : null,
            'employee_id' => $validated['applicant_type'] === 'employee' ? $validated['employee_id'] : null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'total_days' => $totalDays,
            'reason' => $validated['reason'] ?? null,
        ]);

        $leave->leaveDays()->delete();
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            LeaveDay::create([
                'leave_id' => $leave->id,
                'leave_date' => $d->format('Y-m-d'),
                'is_half_day' => false,
            ]);
        }

        return redirect()->route('leaves.show', $leave)->with('success', 'Leave updated.');
    }

    public function destroy(Leave $leaf)
    {
        $leave = $leaf;
        if ($leave->status !== Leave::STATUS_PENDING && $leave->status !== Leave::STATUS_CANCELLED) {
            return back()->with('error', 'Only pending or cancelled leaves can be deleted.');
        }
        $leave->leaveDays()->delete();
        $leave->leaveApprovals()->delete();
        $leave->delete();
        return redirect()->route('leaves.index')->with('success', 'Leave deleted.');
    }

    public function approve(Request $request, Leave $leave)
    {
        if ($leave->status !== Leave::STATUS_PENDING) {
            return back()->with('error', 'Only pending leaves can be approved.');
        }
        $validated = $request->validate([
            'note' => 'nullable|string|max:500',
            'substitute_teacher_id' => 'nullable|exists:teachers,id',
        ]);
        $note = $validated['note'] ?? null;
        $substituteTeacherId = $validated['substitute_teacher_id'] ?? null;

        LeaveApproval::create([
            'leave_id' => $leave->id,
            'approved_by' => auth()->id(),
            'status' => LeaveApproval::STATUS_APPROVED,
            'note' => $note,
            'approved_at' => now(),
        ]);
        $leave->update(['status' => Leave::STATUS_APPROVED]);

        $year = (int) Carbon::parse($leave->start_date)->format('Y');
        if ($leave->teacher_id) {
            $balance = LeaveBalance::firstOrCreate(
                [
                    'leave_type_id' => $leave->leave_type_id,
                    'teacher_id' => $leave->teacher_id,
                    'employee_id' => null,
                    'year' => $year,
                ],
                ['total_days' => 0, 'used_days' => 0, 'remaining_days' => 0]
            );
            $balance->increment('used_days', $leave->total_days);
            $balance->decrement('remaining_days', $leave->total_days);
        }
        if ($leave->employee_id) {
            $balance = LeaveBalance::firstOrCreate(
                [
                    'leave_type_id' => $leave->leave_type_id,
                    'teacher_id' => null,
                    'employee_id' => $leave->employee_id,
                    'year' => $year,
                ],
                ['total_days' => 0, 'used_days' => 0, 'remaining_days' => 0]
            );
            $balance->increment('used_days', $leave->total_days);
            $balance->decrement('remaining_days', $leave->total_days);
        }

        if ($leave->teacher_id) {
            app(TimetableAdjustmentService::class)->createAdjustmentsForTeacherLeave(
                $leave->fresh(['leaveDays']),
                $substituteTeacherId
            );
        }

        return back()->with('success', 'Leave approved.');
    }

    public function reject(Request $request, Leave $leave)
    {
        if ($leave->status !== Leave::STATUS_PENDING) {
            return back()->with('error', 'Only pending leaves can be rejected.');
        }
        $note = $request->validate(['note' => 'nullable|string|max:500'])['note'] ?? null;

        LeaveApproval::create([
            'leave_id' => $leave->id,
            'approved_by' => auth()->id(),
            'status' => LeaveApproval::STATUS_REJECTED,
            'note' => $note,
            'approved_at' => now(),
        ]);
        $leave->update(['status' => Leave::STATUS_REJECTED]);

        return back()->with('success', 'Leave rejected.');
    }
}
