<?php

namespace App\Services\Fee;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class FeeReportService
{
    /**
     * Daily collection total for a date.
     */
    public function dailyCollection(string $date): float
    {
        return (float) Payment::where('payment_date', $date)->sum('amount');
    }

    /**
     * Monthly collection total for a month (YYYY-MM).
     */
    public function monthlyCollection(string $yearMonth): float
    {
        $key = 'fee_report_monthly_' . $yearMonth;
        return (float) Cache::remember($key, 300, function () use ($yearMonth) {
            $start = $yearMonth . '-01';
            $end = date('Y-m-t', strtotime($start));
            return Payment::whereBetween('payment_date', [$start, $end])->sum('amount');
        });
    }

    /**
     * Class-wise collection for a date range. Returns array of class_section_group_id => total.
     */
    public function classWiseCollection(string $startDate, string $endDate): array
    {
        return Payment::query()
            ->join('invoices', 'payments.invoice_id', '=', 'invoices.id')
            ->whereBetween('payments.payment_date', [$startDate, $endDate])
            ->selectRaw('invoices.class_section_group_id, SUM(payments.amount) as total')
            ->groupBy('invoices.class_section_group_id')
            ->pluck('total', 'class_section_group_id')
            ->map(fn ($v) => (float) $v)
            ->all();
    }

    /**
     * Defaulters: invoices with balance > 0.
     */
    public function defaultersList(?string $classSectionGroupId = null, ?string $status = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = Invoice::with([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
        ])->where('balance', '>', 0);

        if ($classSectionGroupId !== null) {
            $query->where('class_section_group_id', $classSectionGroupId);
        }
        if ($status !== null) {
            $query->where('status', $status);
        }
        return $query->orderBy('due_date')->get();
    }

    /**
     * Fine report: sum of fine_amount for a period.
     */
    public function fineReport(string $startDate, string $endDate): float
    {
        return (float) Invoice::whereBetween('issue_date', [$startDate, $endDate])->sum('fine_amount');
    }

    /**
     * Scholarship report: total discount from invoice_discounts or invoice.discount_amount for period.
     */
    public function scholarshipReport(string $startDate, string $endDate): float
    {
        return (float) Invoice::whereBetween('issue_date', [$startDate, $endDate])->sum('discount_amount');
    }

    /**
     * Income summary: total payments in period, optionally by method.
     */
    public function incomeSummary(string $startDate, string $endDate, bool $byMethod = false): array
    {
        $query = Payment::whereBetween('payment_date', [$startDate, $endDate]);
        if ($byMethod) {
            return $query->selectRaw('method, SUM(amount) as total')->groupBy('method')->pluck('total', 'method')->map(fn ($v) => (float) $v)->all();
        }
        return ['total' => (float) $query->sum('amount')];
    }
}
