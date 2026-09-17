<?php

namespace App\Http\Controllers\Dashboard\Employee;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\LeaveDay;
use App\Models\LeaveType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MyLeaveController extends Controller
{
    protected function getEmployeeId(Request $request): ?int
    {
        return $request->user()?->employee?->id;
    }

    protected function authorizeOwnLeave(Leave $leave, int $employeeId): void
    {
        if ($leave->employee_id !== $employeeId) {
            abort(403, 'You can only access your own leave applications.');
        }
    }

    public function index(Request $request)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }

        $query = Leave::with(['leaveType'])
            ->where('employee_id', $employeeId)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $leaves = $query->paginate(15)->withQueryString();

        return Inertia::render('dashboard/employee/MyLeavesIndex', [
            'leaves' => $leaves,
            'filters' => $request->only('status'),
        ]);
    }

    public function create(Request $request)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }

        $leaveTypes = LeaveType::where('for_employees', true)->orderBy('name')->get();
        if ($leaveTypes->isEmpty()) {
            $leaveTypes = LeaveType::orderBy('name')->get();
        }

        return Inertia::render('dashboard/employee/MyLeaveCreate', [
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function store(Request $request)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
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
            'teacher_id' => null,
            'student_enrollment_id' => null,
            'employee_id' => $employeeId,
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

        return redirect()->route('employee.my-leaves.show', $leave)->with('success', 'Leave application submitted. It will be reviewed by admin.');
    }

    public function show(Request $request, Leave $leave)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }
        $this->authorizeOwnLeave($leave, $employeeId);

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

        return Inertia::render('dashboard/employee/MyLeaveShow', [
            'leave' => $payload,
        ]);
    }

    public function edit(Request $request, Leave $leave)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }
        $this->authorizeOwnLeave($leave, $employeeId);

        if ($leave->status !== Leave::STATUS_PENDING) {
            return redirect()->route('employee.my-leaves.show', $leave)->with('error', 'Only pending leaves can be edited.');
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

        return Inertia::render('dashboard/employee/MyLeaveEdit', [
            'leave' => $payload,
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function update(Request $request, Leave $leave)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }
        $this->authorizeOwnLeave($leave, $employeeId);

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

        return redirect()->route('employee.my-leaves.show', $leave)->with('success', 'Leave application updated.');
    }

    public function destroy(Request $request, Leave $leave)
    {
        $employeeId = $this->getEmployeeId($request);
        if (! $employeeId) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }
        $this->authorizeOwnLeave($leave, $employeeId);

        if ($leave->status !== Leave::STATUS_PENDING && $leave->status !== Leave::STATUS_CANCELLED) {
            return back()->with('error', 'Only pending or cancelled leaves can be deleted.');
        }

        $leave->leaveDays()->delete();
        if (method_exists($leave, 'leaveApprovals')) {
            $leave->leaveApprovals()->delete();
        }
        $leave->delete();

        return redirect()->route('employee.my-leaves.index')->with('success', 'Leave application deleted.');
    }
}
