<?php

namespace App\Services\Fee;

use App\Models\ClassFeeStructure;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\OverTimeCharge;
use App\Models\StudentEnrollment;
use App\Models\StudentOptionalService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoInvoiceService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected ScholarshipService $scholarshipService,
        protected InstallmentService $installmentService,
        protected StudentLedgerService $ledgerService
    ) {}

    public function generateForMonth(string $billingMonth): array
    {
        $created = 0;
        $skipped = 0;
        $errors = [];
        $start = Carbon::parse($billingMonth.'-01');
        $end = $start->copy()->endOfMonth();
        $issueDate = $start->format('Y-m-d');
        $dueDate = $start->copy()->addDays(9)->format('Y-m-d');

        // 1) Installment-based invoices for schedules due this month
        $installmentResult = $this->installmentService->generateDueInvoices($billingMonth);
        $created += (int) $installmentResult['created'];
        $skipped += (int) $installmentResult['skipped'];
        foreach ($installmentResult['errors'] as $err) {
            $errors[] = [
                'enrollment_id' => null,
                'schedule_id' => $err['schedule_id'] ?? null,
                'message' => $err['message'] ?? 'Installment invoice failed',
            ];
        }

        // 2) Normal monthly fees for students WITHOUT installment schedule this month
        $enrollments = StudentEnrollment::with(['classSectionGroup.classSection'])
            ->whereHas('classSectionGroup.classSection', function ($q) {
                $q->where('is_active', true);
            })
            ->get();

        foreach ($enrollments as $enrollment) {
            try {
                if ($this->installmentService->hasScheduleForMonth((int) $enrollment->id, $billingMonth)) {
                    // Covered by installment invoice path (or already invoiced via schedule).
                    $skipped++;
                    continue;
                }
                if ($this->invoiceService->hasInvoiceForBillingMonth($enrollment->id, $billingMonth)) {
                    $skipped++;
                    continue;
                }
                $invoice = $this->createInvoiceForEnrollment(
                    $enrollment,
                    $billingMonth,
                    $issueDate,
                    $dueDate,
                    $start,
                    $end
                );
                if ($invoice) {
                    $created++;
                }
            } catch (\Throwable $e) {
                Log::warning('AutoInvoice failed for enrollment '.$enrollment->id.': '.$e->getMessage());
                $errors[] = ['enrollment_id' => $enrollment->id, 'message' => $e->getMessage()];
            }
        }

        return ['created' => $created, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * Build fee lines + scholarship/sibling discounts for an enrollment.
     * Used by auto monthly invoices and manual invoice create.
     *
     * Scholarship / sibling % apply only on base fees (class + optional).
     * Overtime and previous balance are always charged in full after discounts.
     * Example: fee 2000 + 50% scholarship + overtime 500 => payable 1500 (not 1250).
     *
     * @return array{
     *   enrollment_id: int,
     *   lines: list<array{fee_type_id: int, fee_type_name: ?string, description: ?string, amount: float, source: string, source_invoice_id?: int}>,
     *   subtotal: float,
     *   base_subtotal: float,
     *   overtime_total: float,
     *   previous_balance_total: float,
     *   scholarship_discount: float,
     *   sibling_discount: float,
     *   discount_amount: float,
     *   payable: float,
     *   scholarships: list<array{name: string, type: string, value: float, label: string}>
     * }
     */
    public function quoteEnrollment(
        StudentEnrollment $enrollment,
        ?Carbon $periodStart = null,
        ?Carbon $periodEnd = null
    ): array {
        $lines = $this->buildFeeLines($enrollment, $periodStart, $periodEnd);
        $subtotal = round(array_sum(array_column($lines, 'amount')), 2);
        $overtimeTotal = round(array_sum(array_map(
            static fn (array $line) => ($line['source'] ?? '') === 'overtime' ? (float) $line['amount'] : 0.0,
            $lines
        )), 2);
        $previousBalanceTotal = round(array_sum(array_map(
            static fn (array $line) => ($line['source'] ?? '') === 'previous_balance' ? (float) $line['amount'] : 0.0,
            $lines
        )), 2);
        $baseSubtotal = round(max(0, $subtotal - $overtimeTotal - $previousBalanceTotal), 2);

        $scholarshipDiscount = $baseSubtotal > 0
            ? $this->scholarshipService->getDiscountForEnrollment($enrollment, $baseSubtotal)
            : 0.0;
        $siblingDetails = $this->scholarshipService->siblingDiscountDetails($enrollment, $baseSubtotal);
        $siblingDiscount = $baseSubtotal > 0 ? (float) $siblingDetails['amount'] : 0.0;
        $discountAmount = min($baseSubtotal, round($scholarshipDiscount + $siblingDiscount, 2));
        $payable = round(max(0, $baseSubtotal - $discountAmount) + $overtimeTotal + $previousBalanceTotal, 2);

        return [
            'enrollment_id' => (int) $enrollment->id,
            'lines' => $lines,
            'subtotal' => $subtotal,
            'base_subtotal' => $baseSubtotal,
            'overtime_total' => $overtimeTotal,
            'previous_balance_total' => $previousBalanceTotal,
            'scholarship_discount' => $scholarshipDiscount,
            'sibling_discount' => $siblingDiscount,
            'sibling_discount_percentage' => (float) $siblingDetails['percentage'],
            'sibling_count' => (int) $siblingDetails['sibling_count'],
            'sibling_discount_label' => (string) $siblingDetails['label'],
            'discount_amount' => $discountAmount,
            'payable' => $payable,
            'scholarships' => $this->scholarshipService->listForEnrollment($enrollment),
        ];
    }

    /**
     * Recompute invoice discount so scholarship/sibling exclude overtime + previous balance.
     * Returns true when discount/balance changed.
     */
    public function recalculateDiscountsExcludingOvertime(Invoice $invoice): bool
    {
        $invoice->loadMissing([
            'items',
            'enrollment.student',
            'enrollment.studentScholarShips.scholarship',
        ]);

        $enrollment = $invoice->enrollment;
        if (! $enrollment) {
            return false;
        }

        $excludedTotal = round((float) $invoice->items
            ->filter(function ($item) {
                $description = (string) ($item->description ?? '');

                return stripos($description, 'overtime') !== false
                    || stripos($description, 'previous balance') !== false;
            })
            ->sum('amount'), 2);

        $total = round((float) $invoice->items->sum('amount'), 2);
        if ($total <= 0) {
            $total = round((float) $invoice->total_amount, 2);
        }

        $baseSubtotal = round(max(0, $total - $excludedTotal), 2);
        $scholarshipDiscount = $baseSubtotal > 0
            ? $this->scholarshipService->getDiscountForEnrollment($enrollment, $baseSubtotal)
            : 0.0;
        $siblingDiscount = $baseSubtotal > 0
            ? $this->scholarshipService->getSiblingDiscountAmount($enrollment, $baseSubtotal)
            : 0.0;
        $discountAmount = min($baseSubtotal, round($scholarshipDiscount + $siblingDiscount, 2));

        $fine = (float) $invoice->fine_amount;
        $paid = (float) $invoice->paid_amount;
        $carried = (float) ($invoice->carried_forward_amount ?? 0);
        $computed = $this->invoiceService->computePayableBalanceStatus(
            $total,
            $discountAmount,
            $fine,
            $paid,
            $carried
        );

        $changed = abs((float) $invoice->discount_amount - $discountAmount) > 0.009
            || abs((float) $invoice->total_amount - $total) > 0.009
            || abs((float) $invoice->balance - $computed['balance']) > 0.009
            || (string) $invoice->status !== $computed['status'];

        if (! $changed) {
            return false;
        }

        $invoice->update([
            'total_amount' => $total,
            'discount_amount' => $discountAmount,
            'balance' => $computed['balance'],
            'status' => $computed['status'],
        ]);

        return true;
    }

    /**
     * Repair discounts for all invoices in a billing month (scholarship must not apply on overtime).
     */
    public function repairBillingMonthDiscounts(string $billingMonth): int
    {
        $fixed = 0;
        Invoice::query()
            ->with([
                'items',
                'enrollment.student',
                'enrollment.studentScholarShips.scholarship',
            ])
            ->where(function ($q) use ($billingMonth) {
                $q->where('billing_month', $billingMonth)
                    ->orWhere(function ($q2) use ($billingMonth) {
                        $q2->whereNull('billing_month')
                            ->whereRaw("DATE_FORMAT(issue_date, '%Y-%m') = ?", [$billingMonth]);
                    });
            })
            ->orderBy('id')
            ->chunkById(50, function ($invoices) use (&$fixed) {
                foreach ($invoices as $invoice) {
                    if ($this->recalculateDiscountsExcludingOvertime($invoice)) {
                        $fixed++;
                    }
                }
            });

        return $fixed;
    }

    /**
     * Create invoice from class fee structures + optional fees, applying scholarships.
     * Unpaid balances from earlier billing months are added as Previous Balance lines
     * and settled on the source invoices (no double remaining).
     */
    public function createQuotedInvoice(
        StudentEnrollment $enrollment,
        string $issueDate,
        string $dueDate,
        float $fineAmount = 0,
        ?string $billingMonth = null,
        ?Carbon $periodStart = null,
        ?Carbon $periodEnd = null
    ): ?Invoice {
        if ($billingMonth !== null) {
            $periodStart ??= Carbon::parse($billingMonth.'-01')->startOfMonth();
            $periodEnd ??= $periodStart->copy()->endOfMonth();
        }

        $quote = $this->quoteEnrollment($enrollment, $periodStart, $periodEnd);
        if ($quote['subtotal'] <= 0) {
            return null;
        }

        return DB::transaction(function () use ($enrollment, $issueDate, $dueDate, $fineAmount, $billingMonth, $quote) {
            $invoice = $this->invoiceService->createInvoice(
                $enrollment,
                $issueDate,
                $dueDate,
                $quote['subtotal'],
                $quote['discount_amount'],
                $fineAmount,
                $billingMonth
            );

            foreach ($quote['lines'] as $line) {
                $this->invoiceService->addItem(
                    $invoice,
                    $line['fee_type_id'],
                    $line['description'],
                    $line['amount']
                );
            }

            $this->settlePreviousBalanceLines($invoice, $quote['lines'], $issueDate);

            return $invoice->fresh(['items.feeType']);
        });
    }

    protected function createInvoiceForEnrollment(
        StudentEnrollment $enrollment,
        string $billingMonth,
        string $issueDate,
        string $dueDate,
        Carbon $start,
        Carbon $end
    ): ?Invoice {
        return $this->createQuotedInvoice(
            $enrollment,
            $issueDate,
            $dueDate,
            0,
            $billingMonth,
            $start,
            $end
        );
    }

    /**
     * @return list<array{fee_type_id: int, fee_type_name: ?string, description: ?string, amount: float, source: string, source_invoice_id?: int}>
     */
    protected function buildFeeLines(
        StudentEnrollment $enrollment,
        ?Carbon $periodStart = null,
        ?Carbon $periodEnd = null
    ): array {
        $groupId = (int) $enrollment->class_section_group_id;
        $enrollmentId = (int) $enrollment->id;
        $lines = [];

        foreach (
            ClassFeeStructure::with('feeType')
                ->where('class_section_group_id', $groupId)
                ->get() as $cfs
        ) {
            $name = $cfs->feeType?->name;
            $lines[] = [
                'fee_type_id' => (int) $cfs->fee_type_id,
                'fee_type_name' => $name,
                'description' => $name,
                'amount' => round((float) $cfs->amount, 2),
                'source' => 'class_fee',
            ];
        }

        foreach (
            StudentOptionalService::with('feeType')
                ->where('student_enrollment_id', $enrollmentId)
                ->get() as $sos
        ) {
            $name = $sos->feeType?->name;
            $lines[] = [
                'fee_type_id' => (int) $sos->fee_type_id,
                'fee_type_name' => $name,
                'description' => $name ? $name.' (Optional)' : 'Optional',
                'amount' => round((float) $sos->amount, 2),
                'source' => 'optional',
            ];
        }

        if ($periodStart && $periodEnd) {
            $includePriorOvertime = $this->enrollmentIsClassNineOrTen($enrollment);
            $overtimeQuery = OverTimeCharge::with('feeType')
                ->where('student_enrollment_id', $enrollmentId);

            if ($includePriorOvertime) {
                // Class 9 / 10: current-month OT + earlier months not already invoiced.
                $overtimeQuery->where('date', '<=', $periodEnd->toDateString());
            } else {
                $overtimeQuery->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()]);
            }

            $overtime = $overtimeQuery->orderBy('date')->get();

            foreach ($overtime as $ot) {
                $otDate = $ot->date?->toDateString();
                $isPrior = $otDate && $otDate < $periodStart->toDateString();
                if ($includePriorOvertime && $isPrior && $this->overtimeAlreadyInvoiced($enrollmentId, $ot)) {
                    continue;
                }

                $name = $ot->feeType?->name ?: 'Overtime';
                $dateLabel = $ot->date?->format('d M Y');
                $priorTag = $isPrior ? ' · prior month' : '';
                $lines[] = [
                    'fee_type_id' => (int) $ot->fee_type_id,
                    'fee_type_name' => $name,
                    'description' => $dateLabel
                        ? sprintf('%s (Overtime · %s%s)', $name, $dateLabel, $priorTag)
                        : sprintf('%s (Overtime%s)', $name, $priorTag),
                    'amount' => round((float) $ot->amount, 2),
                    'source' => 'overtime',
                ];
            }

            foreach ($this->previousBalanceLines($enrollment, $periodStart) as $arrearsLine) {
                $lines[] = $arrearsLine;
            }
        }

        return $lines;
    }

    /**
     * Unpaid / partial balances from invoices before the billing month.
     *
     * @return list<array{fee_type_id: int, fee_type_name: string, description: string, amount: float, source: string, source_invoice_id: int}>
     */
    protected function previousBalanceLines(StudentEnrollment $enrollment, Carbon $periodStart): array
    {
        $billingMonth = $periodStart->format('Y-m');
        $priorInvoices = Invoice::query()
            ->where('student_enrollment_id', $enrollment->id)
            ->where('balance', '>', 0.009)
            ->where(function ($q) use ($billingMonth, $periodStart) {
                $q->where(function ($q2) use ($billingMonth) {
                    $q2->whereNotNull('billing_month')
                        ->where('billing_month', '<', $billingMonth);
                })->orWhere(function ($q2) use ($periodStart) {
                    $q2->whereNull('billing_month')
                        ->whereDate('issue_date', '<', $periodStart->toDateString());
                });
            })
            ->orderBy('billing_month')
            ->orderBy('id')
            ->get();

        if ($priorInvoices->isEmpty()) {
            return [];
        }

        $feeType = FeeType::firstOrCreate(
            ['name' => 'Previous Balance'],
            ['category' => 'one_time', 'is_refundable' => false]
        );

        $lines = [];
        foreach ($priorInvoices as $prior) {
            $amount = round((float) $prior->balance, 2);
            if ($amount <= 0.009) {
                continue;
            }

            $monthLabel = $prior->billing_month
                ?: ($prior->issue_date?->format('Y-m') ?: 'prior');
            $invoiceNo = $prior->invoice_no ?: ('#'.$prior->id);

            $lines[] = [
                'fee_type_id' => (int) $feeType->id,
                'fee_type_name' => 'Previous Balance',
                'description' => sprintf('Previous Balance (%s · %s)', $monthLabel, $invoiceNo),
                'amount' => $amount,
                'source' => 'previous_balance',
                'source_invoice_id' => (int) $prior->id,
            ];
        }

        return $lines;
    }

    /**
     * Mark source invoices as settled for the amounts carried into the new invoice.
     *
     * @param  list<array{source?: string, amount?: float, source_invoice_id?: int}>  $lines
     */
    protected function settlePreviousBalanceLines(Invoice $newInvoice, array $lines, string $issueDate): void
    {
        foreach ($lines as $line) {
            if (($line['source'] ?? '') !== 'previous_balance') {
                continue;
            }

            $sourceId = (int) ($line['source_invoice_id'] ?? 0);
            $amount = round((float) ($line['amount'] ?? 0), 2);
            if ($sourceId <= 0 || $amount <= 0.009) {
                continue;
            }

            $source = Invoice::query()->lockForUpdate()->find($sourceId);
            if (! $source || (int) $source->student_enrollment_id !== (int) $newInvoice->student_enrollment_id) {
                continue;
            }

            $carry = min(round((float) $source->balance, 2), $amount);
            if ($carry <= 0.009) {
                continue;
            }

            $carriedTotal = round((float) ($source->carried_forward_amount ?? 0) + $carry, 2);
            $computed = $this->invoiceService->computePayableBalanceStatus(
                (float) $source->total_amount,
                (float) $source->discount_amount,
                (float) $source->fine_amount,
                (float) $source->paid_amount,
                $carriedTotal
            );

            $source->update([
                'carried_forward_amount' => $carriedTotal,
                'carried_forward_to_invoice_id' => $newInvoice->id,
                'balance' => $computed['balance'],
                'status' => $computed['status'],
            ]);

            // Credit ledger so arrears are not owed twice when the new invoice debits them.
            $this->ledgerService->createEntry(
                (int) $source->student_enrollment_id,
                'carry_forward',
                0,
                $carry,
                $source->id,
                Invoice::class,
                $issueDate
            );
        }
    }

    /**
     * Class 9 / 10 can carry unpaid overtime from previous months into the current invoice.
     */
    protected function enrollmentIsClassNineOrTen(StudentEnrollment $enrollment): bool
    {
        $enrollment->loadMissing('classSectionGroup.classSection.class');
        $className = strtolower((string) ($enrollment->classSectionGroup?->classSection?->class?->name ?? ''));
        if ($className === '') {
            return false;
        }

        return (bool) preg_match('/\b(9|10|ix|x)\b/i', $className)
            || str_contains($className, 'class 9')
            || str_contains($className, 'class 10')
            || str_contains($className, 'class9')
            || str_contains($className, 'class10');
    }

    protected function overtimeAlreadyInvoiced(int $enrollmentId, OverTimeCharge $ot): bool
    {
        $dateLabel = $ot->date?->format('d M Y');
        if (! $dateLabel) {
            return false;
        }

        return Invoice::query()
            ->where('student_enrollment_id', $enrollmentId)
            ->whereHas('items', function ($q) use ($dateLabel, $ot) {
                $q->where('description', 'like', '%Overtime · '.$dateLabel.'%')
                    ->where('amount', round((float) $ot->amount, 2));
            })
            ->exists();
    }
}
