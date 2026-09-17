<?php

namespace Tests\Unit;

use App\Services\Payroll\PayrollService;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class PayrollAttendanceDeductionTest extends TestCase
{
    public function test_working_days_exclude_sundays(): void
    {
        $service = new PayrollService;
        // August 2026: 31 days, 5 Sundays → 26 working days
        $start = Carbon::create(2026, 8, 1);
        $end = $start->copy()->endOfMonth();
        $this->assertSame(26, $service->countWorkingDays($start, $end));
    }

    public function test_leave_deduction_formula(): void
    {
        $basic = 26000;
        $workingDays = 26;
        $unpaidLeave = 1;
        $absent = 0;
        $expected = round(($basic / $workingDays) * ($unpaidLeave + $absent), 2);
        $this->assertSame(1000.0, $expected);
    }
}
