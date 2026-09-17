<?php

namespace App\Services\Payroll;

use App\Models\AttendanceBasedDeduction;
use App\Models\AttendanceSession;
use App\Models\Employee;
use App\Models\EmployeeAttendance;
use App\Models\Leave;
use App\Models\LeaveDay;
use App\Models\OvertimePayment;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\SalaryAdvance;
use App\Models\Teacher;
use App\Models\TeacherAttendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class PayrollService
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_GENERATED = 'generated';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_GENERATED,
        self::STATUS_APPROVED,
        self::STATUS_PAID,
        self::STATUS_CANCELLED,
    ];

    /**
     * Generate payroll snapshots for selected (or all) staff for a month/year.
     *
     * @param  list<int>|null  $employeeIds
     * @param  list<int>|null  $teacherIds
     * @return array{created: int, skipped: int}
     */
    public function generate(
        string $month,
        int $year,
        ?array $employeeIds = null,
        ?array $teacherIds = null,
        ?string $staffType = null
    ): array {
        $month = str_pad($month, 2, '0', STR_PAD_LEFT);
        $created = 0;
        $skipped = 0;
        $reasons = [];

        $employeeIds = array_values(array_filter(array_map('intval', $employeeIds ?? [])));
        $teacherIds = array_values(array_filter(array_map('intval', $teacherIds ?? [])));
        $hasEmployeeFilter = count($employeeIds) > 0;
        $hasTeacherFilter = count($teacherIds) > 0;

        // If user picked specific people, only generate for those — do not expand to "all".
        if ($staffType === 'employee') {
            $includeEmployees = true;
            $includeTeachers = false;
        } elseif ($staffType === 'teacher') {
            $includeEmployees = false;
            $includeTeachers = true;
        } elseif ($hasEmployeeFilter || $hasTeacherFilter) {
            $includeEmployees = $hasEmployeeFilter;
            $includeTeachers = $hasTeacherFilter;
        } else {
            $includeEmployees = true;
            $includeTeachers = true;
        }

        if ($includeEmployees) {
            $employees = Employee::with(['user', 'salaryStructure.allowances.allowance', 'salaryStructure.deductions.deduction'])
                ->when($hasEmployeeFilter, fn ($q) => $q->whereIn('id', $employeeIds))
                ->get();

            foreach ($employees as $employee) {
                $outcome = $this->generateForPerson($employee->id, null, $month, $year, $employee);
                if ($outcome['payroll']) {
                    $created++;
                } else {
                    $skipped++;
                    if ($outcome['reason']) {
                        $reasons[] = ($employee->user?->name ?? 'Employee #'.$employee->id).': '.$outcome['reason'];
                    }
                }
            }
        }

        if ($includeTeachers) {
            $teachers = Teacher::with(['user', 'salaryStructure.allowances.allowance', 'salaryStructure.deductions.deduction'])
                ->when($hasTeacherFilter, fn ($q) => $q->whereIn('id', $teacherIds))
                ->get();

            foreach ($teachers as $teacher) {
                $outcome = $this->generateForPerson(null, $teacher->id, $month, $year, $teacher);
                if ($outcome['payroll']) {
                    $created++;
                } else {
                    $skipped++;
                    if ($outcome['reason']) {
                        $reasons[] = ($teacher->user?->name ?? 'Teacher #'.$teacher->id).': '.$outcome['reason'];
                    }
                }
            }
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'reasons' => array_slice($reasons, 0, 8),
        ];
    }

    /**
     * @return array{payroll: ?Payroll, reason: ?string}
     */
    public function generateForPerson(
        ?int $employeeId,
        ?int $teacherId,
        string $month,
        int $year,
        Employee|Teacher $person
    ): array {
        $existing = Payroll::query()
            ->when($employeeId, fn ($q) => $q->where('employee_id', $employeeId)->whereNull('teacher_id'))
            ->when($teacherId, fn ($q) => $q->whereNull('employee_id')->where('teacher_id', $teacherId))
            ->where('month', $month)
            ->where('year', $year)
            ->where('status', '!=', self::STATUS_CANCELLED)
            ->first();

        if ($existing) {
            return ['payroll' => null, 'reason' => 'payroll already exists for this month'];
        }

        $structure = $person->salaryStructure;
        $basic = $structure ? (float) $structure->basic_salary : (float) ($person->basic_salary ?? 0);
        if ($basic <= 0) {
            return ['payroll' => null, 'reason' => 'no salary structure / basic salary'];
        }

        try {
            $payroll = DB::transaction(function () use ($employeeId, $teacherId, $month, $year, $basic, $structure) {
                $attendance = $this->buildAttendanceSummary($employeeId, $teacherId, $month, $year, $basic);
                [$items, $overtimeTotal, $advanceDeduction, $overtimeHours] = $this->buildPayrollItems(
                    $employeeId,
                    $teacherId,
                    $month,
                    $year,
                    $basic,
                    $structure,
                    $attendance['leave_deduction_amount']
                );

                $totalAllowances = round(array_sum(array_column(array_filter($items, fn ($i) => $i['type'] === 'allowance'), 'amount')), 2);
                $totalDeductions = round(array_sum(array_column(array_filter($items, fn ($i) => $i['type'] === 'deduction'), 'amount')), 2);
                $net = round(max(0, $basic + $totalAllowances - $totalDeductions), 2);

                $payroll = Payroll::create([
                    'employee_id' => $employeeId,
                    'teacher_id' => $teacherId,
                    'month' => $month,
                    'year' => $year,
                    'basic_salary' => $basic,
                    'total_allowances' => $totalAllowances,
                    'total_deductions' => $totalDeductions,
                    'net_salary' => $net,
                    'status' => self::STATUS_GENERATED,
                    'working_days' => $attendance['working_days'],
                    'present_days' => $attendance['present_days'],
                    'absent_days' => $attendance['absent_days'],
                    'late_days' => $attendance['late_days'],
                    'leave_days' => $attendance['leave_days'],
                    'paid_leave_days' => $attendance['paid_leave_days'],
                    'unpaid_leave_days' => $attendance['unpaid_leave_days'],
                    'overtime_hours' => $overtimeHours,
                    'leave_deduction_amount' => $attendance['leave_deduction_amount'],
                    'is_active' => true,
                ]);

                foreach ($items as $item) {
                    PayrollItem::create([
                        'payroll_id' => $payroll->id,
                        'allowance_id' => $item['allowance_id'],
                        'deduction_id' => $item['deduction_id'],
                        'type' => $item['type'],
                        'name' => $item['name'],
                        'amount' => $item['amount'],
                        'is_active' => true,
                    ]);
                }

                AttendanceBasedDeduction::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $employeeId,
                    'teacher_id' => $teacherId,
                    'working_days' => $attendance['working_days'],
                    'present_days' => $attendance['present_days'],
                    'absent_days' => $attendance['absent_days'],
                    'late_days' => $attendance['late_days'],
                    'leave_days' => $attendance['leave_days'],
                    'paid_leave_days' => $attendance['paid_leave_days'],
                    'leave_without_pay_days' => $attendance['unpaid_leave_days'],
                    'overtime_hours' => $overtimeHours,
                    'amount_deducted' => $attendance['leave_deduction_amount'],
                    'remarks' => 'Snapshot at payroll generate. Leave deduction = Basic / Working Days × (unpaid leave + absent).',
                ]);

                if ($overtimeTotal > 0) {
                    $otQuery = OvertimePayment::query()
                        ->where('month', $month)
                        ->where('year', $year)
                        ->where('status', 'pending');
                    $employeeId
                        ? $otQuery->where('employee_id', $employeeId)->whereNull('teacher_id')
                        : $otQuery->whereNull('employee_id')->where('teacher_id', $teacherId);
                    $otQuery->update(['payroll_id' => $payroll->id, 'status' => 'paid']);
                }

                if ($advanceDeduction > 0) {
                    $remaining = $advanceDeduction;
                    $advQuery = SalaryAdvance::query()
                        ->where('status', 'approved')
                        ->whereNull('recovery_payroll_id')
                        ->orderBy('id');
                    $employeeId
                        ? $advQuery->where('employee_id', $employeeId)->whereNull('teacher_id')
                        : $advQuery->whereNull('employee_id')->where('teacher_id', $teacherId);

                    foreach ($advQuery->get() as $adv) {
                        if ($remaining <= 0) {
                            break;
                        }
                        $recover = min($remaining, (float) $adv->amount - (float) $adv->recovered_amount);
                        if ($recover <= 0) {
                            continue;
                        }
                        $adv->update([
                            'recovery_payroll_id' => $payroll->id,
                            'recovered_amount' => (float) $adv->recovered_amount + $recover,
                            'status' => 'recovered',
                        ]);
                        $remaining -= $recover;
                    }
                }

                return $payroll->fresh(['items', 'attendanceDeduction']);
            });

            return ['payroll' => $payroll, 'reason' => null];
        } catch (\Throwable $e) {
            Log::warning('Payroll generate failed: '.$e->getMessage(), [
                'employee_id' => $employeeId,
                'teacher_id' => $teacherId,
                'month' => $month,
                'year' => $year,
            ]);

            return ['payroll' => null, 'reason' => 'error: '.$e->getMessage()];
        }
    }

    /**
     * @return array{
     *   working_days: int,
     *   present_days: int,
     *   absent_days: int,
     *   late_days: int,
     *   leave_days: int,
     *   paid_leave_days: int,
     *   unpaid_leave_days: int,
     *   leave_deduction_amount: float
     * }
     */
    public function buildAttendanceSummary(
        ?int $employeeId,
        ?int $teacherId,
        string $month,
        int $year,
        float $basic
    ): array {
        $start = Carbon::createFromDate($year, (int) $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $workingDays = $this->countWorkingDays($start, $end);

        $sessionType = $employeeId ? AttendanceSession::TYPE_EMPLOYEE : AttendanceSession::TYPE_TEACHER;
        $statusCounts = [
            'present' => 0,
            'absent' => 0,
            'late' => 0,
            'leave' => 0,
        ];

        if ($employeeId) {
            $rows = EmployeeAttendance::query()
                ->where('employee_id', $employeeId)
                ->whereHas('attendanceSession', function ($q) use ($start, $end, $sessionType) {
                    $q->where('type', $sessionType)
                        ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()]);
                })
                ->get(['status']);
        } else {
            $rows = TeacherAttendance::query()
                ->where('teacher_id', $teacherId)
                ->whereHas('attendanceSession', function ($q) use ($start, $end, $sessionType) {
                    $q->where('type', $sessionType)
                        ->whereBetween('attendance_date', [$start->toDateString(), $end->toDateString()]);
                })
                ->get(['status']);
        }

        foreach ($rows as $row) {
            $status = (string) $row->status;
            if (isset($statusCounts[$status])) {
                $statusCounts[$status]++;
            }
        }

        [$paidLeaveDays, $unpaidLeaveDays] = $this->countPaidUnpaidLeaveDays(
            $employeeId,
            $teacherId,
            $start,
            $end
        );

        // Attendance leave marks without a leave type record count toward unpaid.
        $attendanceLeave = $statusCounts['leave'];
        $classifiedLeave = $paidLeaveDays + $unpaidLeaveDays;
        if ($attendanceLeave > $classifiedLeave) {
            $unpaidLeaveDays += ($attendanceLeave - $classifiedLeave);
        }

        $leaveDays = $paidLeaveDays + $unpaidLeaveDays;
        $absentDays = $statusCounts['absent'];
        $deductibleDays = $unpaidLeaveDays + $absentDays;
        $leaveDeduction = 0.0;
        if ($workingDays > 0 && $deductibleDays > 0 && $basic > 0) {
            $leaveDeduction = round(($basic / $workingDays) * $deductibleDays, 2);
        }

        return [
            'working_days' => $workingDays,
            'present_days' => $statusCounts['present'] + $statusCounts['late'],
            'absent_days' => $absentDays,
            'late_days' => $statusCounts['late'],
            'leave_days' => $leaveDays,
            'paid_leave_days' => $paidLeaveDays,
            'unpaid_leave_days' => $unpaidLeaveDays,
            'leave_deduction_amount' => $leaveDeduction,
        ];
    }

    /**
     * Mon–Sat working days in range (common school calendar).
     */
    public function countWorkingDays(Carbon $start, Carbon $end): int
    {
        $days = 0;
        $cursor = $start->copy();
        while ($cursor->lte($end)) {
            if ($cursor->dayOfWeek !== Carbon::SUNDAY) {
                $days++;
            }
            $cursor->addDay();
        }

        return $days;
    }

    /**
     * @return array{0: int, 1: int} [paid, unpaid]
     */
    protected function countPaidUnpaidLeaveDays(
        ?int $employeeId,
        ?int $teacherId,
        Carbon $start,
        Carbon $end
    ): array {
        $days = LeaveDay::query()
            ->whereBetween('leave_date', [$start->toDateString(), $end->toDateString()])
            ->whereHas('leave', function ($q) use ($employeeId, $teacherId) {
                $q->where('status', Leave::STATUS_APPROVED);
                if ($employeeId) {
                    $q->where('employee_id', $employeeId)->whereNull('teacher_id');
                } else {
                    $q->where('teacher_id', $teacherId)->whereNull('employee_id');
                }
            })
            ->with('leave.leaveType')
            ->get();

        $paid = 0;
        $unpaid = 0;
        foreach ($days as $day) {
            $weight = $day->is_half_day ? 0.5 : 1.0;
            if ($day->leave?->leaveType?->is_paid) {
                $paid += $weight;
            } else {
                $unpaid += $weight;
            }
        }

        return [(int) ceil($paid), (int) ceil($unpaid)];
    }

    /**
     * @return array{0: list<array>, 1: float, 2: float, 3: float}
     */
    protected function buildPayrollItems(
        ?int $employeeId,
        ?int $teacherId,
        string $month,
        int $year,
        float $basic,
        $structure,
        float $leaveDeduction
    ): array {
        $items = [];

        if ($structure) {
            foreach ($structure->allowances as $sa) {
                $val = (float) $sa->value;
                $amount = $sa->type === 'percentage' ? round($basic * $val / 100, 2) : $val;
                $items[] = [
                    'type' => 'allowance',
                    'name' => $sa->allowance?->name ?? 'Allowance',
                    'amount' => $amount,
                    'allowance_id' => $sa->allowance_id,
                    'deduction_id' => null,
                ];
            }
            foreach ($structure->deductions as $sd) {
                $val = (float) $sd->value;
                $amount = $sd->type === 'percentage' ? round($basic * $val / 100, 2) : $val;
                $items[] = [
                    'type' => 'deduction',
                    'name' => $sd->deduction?->name ?? 'Deduction',
                    'amount' => $amount,
                    'allowance_id' => null,
                    'deduction_id' => $sd->deduction_id,
                ];
            }
        }

        $overtimeQuery = OvertimePayment::query()
            ->where('month', $month)
            ->where('year', $year)
            ->where('status', 'pending');
        $employeeId
            ? $overtimeQuery->where('employee_id', $employeeId)->whereNull('teacher_id')
            : $overtimeQuery->whereNull('employee_id')->where('teacher_id', $teacherId);

        $overtimeRows = $overtimeQuery->get();
        $overtimeTotal = round((float) $overtimeRows->sum('amount'), 2);
        $overtimeHours = round((float) $overtimeRows->sum('hours'), 2);
        if ($overtimeTotal > 0) {
            $items[] = [
                'type' => 'allowance',
                'name' => 'Overtime',
                'amount' => $overtimeTotal,
                'allowance_id' => null,
                'deduction_id' => null,
            ];
        }

        if ($leaveDeduction > 0) {
            $items[] = [
                'type' => 'deduction',
                'name' => 'Leave / Absent Deduction',
                'amount' => $leaveDeduction,
                'allowance_id' => null,
                'deduction_id' => null,
            ];
        }

        $advanceQuery = SalaryAdvance::query()
            ->where('status', 'approved')
            ->whereNull('recovery_payroll_id');
        $employeeId
            ? $advanceQuery->where('employee_id', $employeeId)->whereNull('teacher_id')
            : $advanceQuery->whereNull('employee_id')->where('teacher_id', $teacherId);

        $advanceDeduction = (float) $advanceQuery
            ->selectRaw('COALESCE(SUM(amount - recovered_amount), 0) as total')
            ->value('total');

        $totalAllowancesSoFar = array_sum(array_column(array_filter($items, fn ($i) => $i['type'] === 'allowance'), 'amount'));
        $totalDeductionsSoFar = array_sum(array_column(array_filter($items, fn ($i) => $i['type'] === 'deduction'), 'amount'));
        $advanceDeduction = min($advanceDeduction, max(0, $basic + $totalAllowancesSoFar - $totalDeductionsSoFar));
        if ($advanceDeduction > 0) {
            $items[] = [
                'type' => 'deduction',
                'name' => 'Salary Advance',
                'amount' => round($advanceDeduction, 2),
                'allowance_id' => null,
                'deduction_id' => null,
            ];
        }

        return [$items, $overtimeTotal, $advanceDeduction, $overtimeHours];
    }

    public function approve(Payroll $payroll): Payroll
    {
        if (! in_array($payroll->status, [self::STATUS_GENERATED, self::STATUS_DRAFT], true)) {
            throw new InvalidArgumentException('Only draft/generated payroll can be approved.');
        }
        $payroll->update(['status' => self::STATUS_APPROVED]);

        return $payroll->fresh();
    }

    public function markPaid(
        Payroll $payroll,
        string $paymentDate,
        ?string $paymentMethod = null,
        ?string $transactionId = null
    ): Payroll {
        if (! in_array($payroll->status, [self::STATUS_APPROVED, self::STATUS_GENERATED], true)) {
            throw new InvalidArgumentException('Only approved (or generated) payroll can be marked paid.');
        }

        $payroll->update([
            'status' => self::STATUS_PAID,
            'payment_date' => $paymentDate,
            'payment_method' => $paymentMethod,
            'transaction_id' => $transactionId,
        ]);

        return $payroll->fresh();
    }

    public function cancel(Payroll $payroll): Payroll
    {
        if ($payroll->status === self::STATUS_PAID) {
            throw new InvalidArgumentException('Paid payroll cannot be cancelled. Reverse payment first.');
        }
        if ($payroll->status === self::STATUS_CANCELLED) {
            return $payroll;
        }

        $payroll->update(['status' => self::STATUS_CANCELLED, 'is_active' => false]);

        return $payroll->fresh();
    }
}
