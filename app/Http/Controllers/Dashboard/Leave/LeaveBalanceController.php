<?php

namespace App\Http\Controllers\Dashboard\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\Teacher;
use App\Models\Employee;
use Illuminate\Http\Request;

class LeaveBalanceController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveBalance::with(['leaveType', 'teacher.user', 'employee.user']);

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }
        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        $balances = $query->orderBy('year', 'desc')->orderBy('leave_type_id')->paginate(20)->withQueryString();
        $leaveTypes = LeaveType::orderBy('name')->get(['id', 'name']);
        $years = range((int) date('Y'), (int) date('Y') - 5);
        
        $teachers = Teacher::with('user:id,name')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->user?->name ?? 'Teacher #' . $t->id,
        ]);
        $employees = Employee::with('user:id,name')->get()->map(fn ($e) => [
            'id' => $e->id,
            'name' => $e->user?->name ?? 'Employee #' . $e->id,
        ]);

        return inertia('dashboard/leave/LeaveBalances', [
            'balances' => $balances,
            'leaveTypes' => $leaveTypes,
            'years' => $years,
            'teachers' => $teachers,
            'employees' => $employees,
            'filters' => $request->only(['year', 'leave_type_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'applicant_type' => 'required|in:teacher,employee',
            'teacher_id' => 'nullable|required_if:applicant_type,teacher|exists:teachers,id',
            'employee_id' => 'nullable|required_if:applicant_type,employee|exists:employees,id',
            'year' => 'required|integer|min:2000|max:2100',
            'total_days' => 'required|integer|min:0',
        ]);

        $teacherId = $validated['applicant_type'] === 'teacher' ? $validated['teacher_id'] : null;
        $employeeId = $validated['applicant_type'] === 'employee' ? $validated['employee_id'] : null;

        $exists = LeaveBalance::where('leave_type_id', $validated['leave_type_id'])
            ->where('teacher_id', $teacherId)
            ->where('employee_id', $employeeId)
            ->where('year', $validated['year'])
            ->exists();
        if ($exists) {
            return back()->with('error', 'Balance for this leave type, person and year already exists.');
        }

        LeaveBalance::create([
            'leave_type_id' => $validated['leave_type_id'],
            'teacher_id' => $teacherId,
            'employee_id' => $employeeId,
            'year' => $validated['year'],
            'total_days' => $validated['total_days'],
            'used_days' => 0,
            'remaining_days' => $validated['total_days'],
        ]);

        return back()->with('success', 'Leave balance created.');
    }

    public function update(Request $request, LeaveBalance $leaveBalance)
    {
        $validated = $request->validate([
            'total_days' => 'required|integer|min:0',
        ]);
        $used = $leaveBalance->used_days;
        $newTotal = $validated['total_days'];
        $leaveBalance->update([
            'total_days' => $newTotal,
            'remaining_days' => max(0, $newTotal - $used),
        ]);
        return back()->with('success', 'Leave balance updated.');
    }
}
