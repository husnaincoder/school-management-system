<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Payslip as PayslipModel;
use App\Services\Setting\SystemSettingService;
use App\Support\AmountInWords;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;

class PayslipController extends Controller
{
    public function __construct(
        protected SystemSettingService $settings
    ) {}

    public function download(Payroll $payroll)
    {
        Gate::authorize('downloadSlip', $payroll);

        if (in_array($payroll->status, [Payroll::STATUS_CANCELLED, Payroll::STATUS_DRAFT], true)) {
            abort(403, 'Salary slip is not available for this payroll status.');
        }

        $payroll->load([
            'employee.user',
            'teacher.user',
            'items',
        ]);

        $employeeName = $payroll->staffName();
        $employeeId = $payroll->staffIdentifier();
        $person = $payroll->employee_id ? $payroll->employee : $payroll->teacher;

        PayslipModel::firstOrCreate(
            ['payroll_id' => $payroll->id],
            ['generated_at' => now()]
        );

        $branding = $this->settings->getPdfBranding();
        $schoolBranding = $this->settings->getBranding();
        $schoolName = $schoolBranding['company_name']
            ?: ($branding['school_name'] ?? config('app.name', 'School'));

        $pdf = Pdf::loadView('pdf.payslip', [
            'payroll' => $payroll,
            'employeeName' => $employeeName,
            'employeeId' => $employeeId !== '—' ? $employeeId : '',
            'staffType' => $payroll->staffType(),
            'items' => $payroll->items,
            'attendance' => [
                'working_days' => (int) $payroll->working_days,
                'present_days' => (int) $payroll->present_days,
                'absent_days' => (int) $payroll->absent_days,
                'late_days' => (int) $payroll->late_days,
                'leave_days' => (int) $payroll->leave_days,
                'paid_leave_days' => (int) $payroll->paid_leave_days,
                'unpaid_leave_days' => (int) $payroll->unpaid_leave_days,
                'overtime_hours' => (float) $payroll->overtime_hours,
            ],
            'status' => $payroll->status,
            'schoolName' => $schoolName,
            'schoolAddress' => null,
            'logoSrc' => $branding['logo_src'] ?? null,
            'joiningDate' => $person?->joining_date?->format('d M Y') ?? '—',
            'designation' => $person?->designation ?: ($payroll->staffType()),
            'department' => $person?->department ?: '—',
            'amountInWords' => AmountInWords::convert((float) $payroll->net_salary),
        ])->setPaper('a4', 'portrait');

        $filename = 'payslip-'.($payroll->employee_id ?? 't'.$payroll->teacher_id).'-'.$payroll->year.'-'.$payroll->month.'.pdf';

        return $pdf->download($filename);
    }
}
