<?php

namespace App\Http\Controllers\Dashboard\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\LeaveDay;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyLeaveController extends Controller
{
    protected function getTeacherId(Request $request): ?int
    {
        $teacher = $request->user()?->teacher;
        return $teacher?->id;
    }

    protected function authorizeOwnLeave(Leave $leave, int $teacherId): void
    {
        if ($leave->teacher_id !== $teacherId) {
            abort(403, 'You can only access your own leave applications.');
        }
    }

    public function index(Request $request)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $query = Leave::with(['leaveType'])
            ->where('teacher_id', $teacherId)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $leaves = $query->paginate(15)->withQueryString();
        $leaveTypes = LeaveType::orderBy('name')->get(['id', 'name']);

        return Inertia::render('dashboard/teacher/MyLeavesIndex', [
            'leaves' => $leaves,
            'leaveTypes' => $leaveTypes,
            'filters' => $request->only('status'),
        ]);
    }

    public function create(Request $request)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $leaveTypes = LeaveType::where('for_teachers', true)->orderBy('name')->get();
        if ($leaveTypes->isEmpty()) {
            $leaveTypes = LeaveType::orderBy('name')->get();
        }

        return Inertia::render('dashboard/teacher/MyLeaveCreate', [
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function store(Request $request)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $totalDays = $start->diffInDays($end) + 1;

        $leave = Leave::create([
            'leave_type_id' => $validated['leave_type_id'],
            'teacher_id' => $teacherId,
            'student_enrollment_id' => null,
            'employee_id' => null,
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

        return redirect()->route('teacher.my-leaves.show', $leave)->with('success', 'Leave application submitted. It will be reviewed by admin.');
    }

    public function show(Request $request, Leave $leave)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }
        $this->authorizeOwnLeave($leave, $teacherId);

        $leave->load(['leaveType', 'leaveDays']);

        $payload = [
            'id' => $leave->id,
            'leave_type_id' => $leave->leave_type_id,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'total_days' => $leave->total_days,
            'reason' => $leave->reason,
            'status' => $leave->status,
            'leave_type' => $leave->leaveType ? ['id' => $leave->leaveType->id, 'name' => $leave->leaveType->name] : null,
        ];

        return Inertia::render('dashboard/teacher/MyLeaveShow', [
            'leave' => $payload,
        ]);
    }

    public function edit(Request $request, Leave $leave)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }
        $this->authorizeOwnLeave($leave, $teacherId);

        if ($leave->status !== Leave::STATUS_PENDING) {
            return redirect()->route('teacher.my-leaves.show', $leave)->with('error', 'Only pending leaves can be edited.');
        }

        $leaveTypes = LeaveType::orderBy('name')->get();
        $payload = [
            'id' => $leave->id,
            'leave_type_id' => $leave->leave_type_id,
            'start_date' => $leave->start_date?->format('Y-m-d'),
            'end_date' => $leave->end_date?->format('Y-m-d'),
            'reason' => $leave->reason,
            'status' => $leave->status,
        ];

        return Inertia::render('dashboard/teacher/MyLeaveEdit', [
            'leave' => $payload,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function update(Request $request, Leave $leave)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }
        $this->authorizeOwnLeave($leave, $teacherId);

        if ($leave->status !== Leave::STATUS_PENDING) {
            return back()->with('error', 'Only pending leaves can be updated.');
        }

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:2000',
        ]);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $totalDays = $start->diffInDays($end) + 1;

        $leave->update([
            'leave_type_id' => $validated['leave_type_id'],
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

        return redirect()->route('teacher.my-leaves.show', $leave)->with('success', 'Leave application updated.');
    }

    public function destroy(Request $request, Leave $leave)
    {
        $teacherId = $this->getTeacherId($request);
        if (! $teacherId) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }
        $this->authorizeOwnLeave($leave, $teacherId);

        if ($leave->status !== Leave::STATUS_PENDING && $leave->status !== Leave::STATUS_CANCELLED) {
            return back()->with('error', 'Only pending or cancelled leaves can be deleted.');
        }

        $leave->leaveDays()->delete();
        $leave->leaveApprovals()->delete();
        $leave->delete();

        return redirect()->route('teacher.my-leaves.index')->with('success', 'Leave application deleted.');
    }
}
