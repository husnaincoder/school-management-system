<?php

namespace App\Http\Controllers\Dashboard\Staff;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MySalaryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = $user?->employee;
        $teacher = $user?->teacher;

        if (! $employee && ! $teacher) {
            return redirect()->to($user->getDashboardUrl())->with('error', 'Staff profile not found.');
        }

        $query = Payroll::query()
            ->whereIn('status', [
                Payroll::STATUS_GENERATED,
                Payroll::STATUS_APPROVED,
                Payroll::STATUS_PAID,
            ])
            ->orderByDesc('year')
            ->orderByDesc('month');

        if ($employee) {
            $query->where('employee_id', $employee->id);
        } else {
            $query->where('teacher_id', $teacher->id);
        }

        $payrolls = $query->paginate(12)->withQueryString()->through(fn (Payroll $p) => [
            'id' => $p->id,
            'month' => $p->month,
            'year' => $p->year,
            'basic_salary' => $p->basic_salary,
            'total_allowances' => $p->total_allowances,
            'total_deductions' => $p->total_deductions,
            'net_salary' => $p->net_salary,
            'status' => $p->status,
            'payment_date' => $p->payment_date?->format('Y-m-d'),
            'can_download' => in_array($p->status, [Payroll::STATUS_APPROVED, Payroll::STATUS_PAID, Payroll::STATUS_GENERATED], true),
        ]);

        return Inertia::render('dashboard/staff/MySalary', [
            'staffName' => $user->name,
            'staffType' => $employee ? 'Employee' : 'Teacher',
            'payrolls' => $payrolls,
            'dashboardRoute' => $employee ? 'dashboard.employee' : 'dashboard.teacher',
        ]);
    }

    public function slips(Request $request)
    {
        $user = $request->user();
        $employee = $user?->employee;
        $teacher = $user?->teacher;

        if (! $employee && ! $teacher) {
            return redirect()->to($user->getDashboardUrl())->with('error', 'Staff profile not found.');
        }

        $query = Payroll::query()
            ->whereIn('status', [
                Payroll::STATUS_GENERATED,
                Payroll::STATUS_APPROVED,
                Payroll::STATUS_PAID,
            ])
            ->orderByDesc('year')
            ->orderByDesc('month');

        if ($employee) {
            $query->where('employee_id', $employee->id);
        } else {
            $query->where('teacher_id', $teacher->id);
        }

        $slips = $query->get()->map(fn (Payroll $p) => [
            'id' => $p->id,
            'month' => $p->month,
            'year' => $p->year,
            'net_salary' => $p->net_salary,
            'status' => $p->status,
        ]);

        return Inertia::render('dashboard/staff/MySalarySlips', [
            'staffName' => $user->name,
            'staffType' => $employee ? 'Employee' : 'Teacher',
            'slips' => $slips,
            'dashboardRoute' => $employee ? 'dashboard.employee' : 'dashboard.teacher',
        ]);
    }
}
