<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Teacher;
use App\Services\Payroll\PayrollService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use InvalidArgumentException;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function __construct(
        protected PayrollService $payrollService
    ) {}

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Payroll::class);

        $month = $request->get('month', (string) (int) now()->format('m'));
        $month = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $year = $request->get('year', (string) now()->year);
        $staffType = $request->get('staff_type', 'all');
        $status = $request->get('status', 'all');

        $payrolls = Payroll::with(['employee.user', 'teacher.user'])
            ->when($month, fn ($q) => $q->where('month', $month))
            ->when($year, fn ($q) => $q->where('year', (int) $year))
            ->when($staffType === 'employee', fn ($q) => $q->whereNotNull('employee_id'))
            ->when($staffType === 'teacher', fn ($q) => $q->whereNotNull('teacher_id'))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->where('status', '!=', Payroll::STATUS_CANCELLED)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->orderBy('id')
            ->get()
            ->map(fn (Payroll $p) => $this->mapPayrollRow($p));

        return Inertia::render('dashboard/payroll/Payrolls', [
            'payrolls' => $payrolls,
            'filterMonth' => $month,
            'filterYear' => (string) $year,
            'filterStaffType' => $staffType,
            'filterStatus' => $status,
            'employees' => Employee::with('user')->get()->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->user?->name ?? '—',
                'employee_id' => $e->employee_id,
            ]),
            'teachers' => Teacher::with('user')->get()->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->user?->name ?? '—',
                'staff_id' => $t->staff_id,
            ]),
            'canGenerate' => Gate::allows('generate', Payroll::class),
            'canApprove' => $request->user()?->can('payroll.approve')
                || $request->user()?->hasAnyRole(['super_admin', 'admin', 'accountant']),
            'canPay' => $request->user()?->can('payroll.pay')
                || $request->user()?->hasAnyRole(['super_admin', 'admin', 'accountant']),
        ]);
    }

    public function generate(Request $request)
    {
        Gate::authorize('generate', Payroll::class);

        $validated = $request->validate([
            'month' => 'required|string|size:2',
            'year' => 'required|integer|min:2000|max:2100',
            'staff_type' => 'nullable|in:all,employee,teacher',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
        ]);

        $month = $validated['month'];
        $year = (int) $validated['year'];
        $staffType = $validated['staff_type'] ?? 'all';

        $result = $this->payrollService->generate(
            $month,
            $year,
            $validated['employee_ids'] ?? [],
            $validated['teacher_ids'] ?? [],
            $staffType
        );

        $redirect = redirect()->route('payroll.index', [
            'month' => $month,
            'year' => $year,
            'staff_type' => $staffType,
        ]);

        if ($result['created'] === 0) {
            $detail = $result['reasons']
                ? ' '.implode('; ', $result['reasons'])
                : ' Add Salary Structure (basic salary) first, or payroll may already exist for this month.';

            return $redirect->with('error', 'No payroll created.'.$detail);
        }

        $message = "Payroll generated. {$result['created']} created";
        if ($result['skipped'] > 0) {
            $message .= ", {$result['skipped']} skipped";
            if ($result['reasons']) {
                $message .= ' ('.implode('; ', $result['reasons']).')';
            }
        }
        $message .= '.';

        return $redirect->with('success', $message);
    }

    public function approve(Payroll $payroll)
    {
        Gate::authorize('approve', $payroll);

        try {
            $this->payrollService->approve($payroll);
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Payroll approved.');
    }

    public function pay(Request $request, Payroll $payroll)
    {
        Gate::authorize('pay', $payroll);

        $validated = $request->validate([
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|max:100',
            'transaction_id' => 'nullable|string|max:100',
        ]);

        try {
            $this->payrollService->markPaid(
                $payroll,
                $validated['payment_date'],
                $validated['payment_method'] ?? null,
                $validated['transaction_id'] ?? null
            );
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Payroll marked as paid. Salary slip is available.');
    }

    public function cancel(Payroll $payroll)
    {
        Gate::authorize('cancel', $payroll);

        try {
            $this->payrollService->cancel($payroll);
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Payroll cancelled.');
    }

    public function show(Payroll $payroll)
    {
        Gate::authorize('view', $payroll);

        $payroll->load('employee.user', 'teacher.user', 'items', 'attendanceDeduction');

        return Inertia::render('dashboard/payroll/PayrollShow', [
            'payroll' => array_merge($this->mapPayrollRow($payroll), [
                'payment_method' => $payroll->payment_method,
                'transaction_id' => $payroll->transaction_id,
                'remarks' => $payroll->remarks,
                'items' => $payroll->items->map(fn ($i) => [
                    'id' => $i->id,
                    'type' => $i->type,
                    'name' => $i->name,
                    'amount' => $i->amount,
                ]),
                'attendance' => [
                    'working_days' => (int) $payroll->working_days,
                    'present_days' => (int) $payroll->present_days,
                    'absent_days' => (int) $payroll->absent_days,
                    'late_days' => (int) $payroll->late_days,
                    'leave_days' => (int) $payroll->leave_days,
                    'paid_leave_days' => (int) $payroll->paid_leave_days,
                    'unpaid_leave_days' => (int) $payroll->unpaid_leave_days,
                    'overtime_hours' => (float) $payroll->overtime_hours,
                    'leave_deduction_amount' => (float) $payroll->leave_deduction_amount,
                ],
            ]),
            'canApprove' => Gate::allows('approve', $payroll),
            'canPay' => Gate::allows('pay', $payroll),
            'canDownload' => Gate::allows('downloadSlip', $payroll),
        ]);
    }

    public function slips(Request $request)
    {
        Gate::authorize('viewAny', Payroll::class);

        $month = $request->get('month');
        $year = $request->get('year');

        $payrolls = Payroll::with(['employee.user', 'teacher.user', 'payslip'])
            ->whereIn('status', [Payroll::STATUS_APPROVED, Payroll::STATUS_PAID, Payroll::STATUS_GENERATED])
            ->when($month, fn ($q) => $q->where('month', str_pad((string) $month, 2, '0', STR_PAD_LEFT)))
            ->when($year, fn ($q) => $q->where('year', (int) $year))
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->orderBy('id')
            ->get()
            ->map(fn (Payroll $p) => $this->mapPayrollRow($p));

        return Inertia::render('dashboard/payroll/SalarySlips', [
            'payrolls' => $payrolls,
            'filterMonth' => $month,
            'filterYear' => $year,
        ]);
    }

    public function reports(Request $request)
    {
        Gate::authorize('viewAny', Payroll::class);

        $month = $request->get('month', now()->format('m'));
        $month = str_pad((string) $month, 2, '0', STR_PAD_LEFT);
        $year = (int) $request->get('year', now()->year);

        $rows = Payroll::with(['employee.user', 'teacher.user'])
            ->where('month', $month)
            ->where('year', $year)
            ->where('status', '!=', Payroll::STATUS_CANCELLED)
            ->get();

        $summary = [
            'count' => $rows->count(),
            'gross' => round((float) $rows->sum(fn ($p) => (float) $p->basic_salary + (float) $p->total_allowances), 2),
            'deductions' => round((float) $rows->sum('total_deductions'), 2),
            'net' => round((float) $rows->sum('net_salary'), 2),
            'generated' => $rows->where('status', Payroll::STATUS_GENERATED)->count(),
            'approved' => $rows->where('status', Payroll::STATUS_APPROVED)->count(),
            'paid' => $rows->where('status', Payroll::STATUS_PAID)->count(),
            'leave_deductions' => round((float) $rows->sum('leave_deduction_amount'), 2),
        ];

        return Inertia::render('dashboard/payroll/PayrollReports', [
            'summary' => $summary,
            'payrolls' => $rows->map(fn (Payroll $p) => $this->mapPayrollRow($p)),
            'filterMonth' => $month,
            'filterYear' => (string) $year,
        ]);
    }

    protected function mapPayrollRow(Payroll $p): array
    {
        return [
            'id' => $p->id,
            'employee_id' => $p->employee_id,
            'teacher_id' => $p->teacher_id,
            'staff_type' => $p->staffType(),
            'employee_name' => $p->staffName(),
            'employee_identifier' => $p->staffIdentifier(),
            'month' => $p->month,
            'year' => $p->year,
            'basic_salary' => $p->basic_salary,
            'total_allowances' => $p->total_allowances,
            'total_deductions' => $p->total_deductions,
            'net_salary' => $p->net_salary,
            'gross' => round((float) $p->basic_salary + (float) $p->total_allowances, 2),
            'status' => $p->status ?? Payroll::STATUS_GENERATED,
            'payment_date' => $p->payment_date?->format('Y-m-d'),
            'working_days' => (int) ($p->working_days ?? 0),
            'present_days' => (int) ($p->present_days ?? 0),
            'absent_days' => (int) ($p->absent_days ?? 0),
            'late_days' => (int) ($p->late_days ?? 0),
            'paid_leave_days' => (int) ($p->paid_leave_days ?? 0),
            'unpaid_leave_days' => (int) ($p->unpaid_leave_days ?? 0),
            'overtime_hours' => (float) ($p->overtime_hours ?? 0),
            'leave_deduction_amount' => (float) ($p->leave_deduction_amount ?? 0),
        ];
    }
}
