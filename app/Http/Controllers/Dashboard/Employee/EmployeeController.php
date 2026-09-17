<?php

namespace App\Http\Controllers\Dashboard\Employee;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAttendance;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    protected function getEmployee(Request $request)
    {
        return $request->user()?->employee;
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $employee = $this->getEmployee($request);

        if (! $employee) {
            return Inertia::render('dashboard/employee/Index', [
                'employee' => null,
                'profilePending' => true,
                'userName' => $user->name,
                'attendanceStats' => ['present' => 0, 'absent' => 0, 'late' => 0, 'leave' => 0],
                'recentPayrolls' => [],
                'pendingLeaves' => 0,
            ]);
        }

        $employee->load('user');

        $attendanceQuery = EmployeeAttendance::where('employee_id', $employee->id);
        $attendanceStats = [
            'present' => (clone $attendanceQuery)->where('status', EmployeeAttendance::STATUS_PRESENT)->count(),
            'absent' => (clone $attendanceQuery)->where('status', EmployeeAttendance::STATUS_ABSENT)->count(),
            'late' => (clone $attendanceQuery)->where('status', EmployeeAttendance::STATUS_LATE)->count(),
            'leave' => (clone $attendanceQuery)->where('status', EmployeeAttendance::STATUS_LEAVE)->count(),
        ];

        $recentPayrolls = Payroll::where('employee_id', $employee->id)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->limit(3)
            ->get();

        $pendingLeaves = $employee->leaves()->where('status', 'pending')->count();

        return Inertia::render('dashboard/employee/Index', [
            'employee' => $employee,
            'profilePending' => false,
            'userName' => $user->name,
            'attendanceStats' => $attendanceStats,
            'recentPayrolls' => $recentPayrolls,
            'pendingLeaves' => $pendingLeaves,
        ]);
    }

    public function attendance(Request $request)
    {
        $employee = $this->getEmployee($request);
        if (! $employee) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }

        $query = EmployeeAttendance::with('attendanceSession')
            ->where('employee_id', $employee->id)
            ->whereHas('attendanceSession', function ($q) use ($request) {
                if ($request->filled('date_from')) {
                    $q->whereDate('attendance_date', '>=', $request->date_from);
                }
                if ($request->filled('date_to')) {
                    $q->whereDate('attendance_date', '<=', $request->date_to);
                }
            })
            ->join('attendance_sessions', 'attendance_sessions.id', '=', 'employee_attendances.attendance_session_id')
            ->orderByDesc('attendance_sessions.attendance_date')
            ->select('employee_attendances.*');

        $records = $query->paginate(20)->withQueryString();

        $statsQuery = EmployeeAttendance::where('employee_id', $employee->id);
        $stats = [
            'present' => (clone $statsQuery)->where('status', EmployeeAttendance::STATUS_PRESENT)->count(),
            'absent' => (clone $statsQuery)->where('status', EmployeeAttendance::STATUS_ABSENT)->count(),
            'late' => (clone $statsQuery)->where('status', EmployeeAttendance::STATUS_LATE)->count(),
            'leave' => (clone $statsQuery)->where('status', EmployeeAttendance::STATUS_LEAVE)->count(),
        ];

        return Inertia::render('dashboard/employee/Attendance', [
            'employee' => $employee->load('user'),
            'records' => $records,
            'stats' => $stats,
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }

    public function salary(Request $request)
    {
        $employee = $this->getEmployee($request);
        if (! $employee) {
            return redirect()->route('dashboard.employee')->with('error', 'Employee profile not found.');
        }

        $payrolls = Payroll::where('employee_id', $employee->id)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('dashboard/employee/Salary', [
            'employee' => $employee->load('user'),
            'payrolls' => $payrolls,
        ]);
    }
}
