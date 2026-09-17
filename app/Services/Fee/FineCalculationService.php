<?php

namespace App\Services\Fee;

use App\Models\Invoice;
use App\Models\LateFineRule;
use Illuminate\Support\Facades\DB;

class FineCalculationService
{
    public function __construct(
        protected StudentLedgerService $ledgerService
    ) {}

    /**
     * Calculate total fine for an invoice (from due_date to today) based on late_fine_rules.
     */
    public function calculateFineForInvoice(Invoice $invoice): float
    {
        $due = $invoice->due_date;
        if (! $due) {
            return 0.0;
        }

        $dueDate = $due->copy()->startOfDay();
        $today = now()->startOfDay();

        // Fine starts the day after due date.
        if ($dueDate->gte($today)) {
            return 0.0;
        }

        $daysLate = (int) $dueDate->diffInDays($today);
        if ($daysLate <= 0) {
            return 0.0;
        }

        $invoice->loadMissing('classSectionGroup.classSection');
        $cs = $invoice->classSectionGroup?->classSection;
        $academicSessionId = $cs?->academic_session_id;
        $classSectionGroupId = $invoice->class_section_group_id;

        if (! $academicSessionId) {
            return 0.0;
        }

        $rule = LateFineRule::query()
            ->where('academic_session_id', $academicSessionId)
            ->where(function ($q) use ($classSectionGroupId) {
                $q->where('class_section_group_id', $classSectionGroupId)
                    ->orWhereNull('class_section_group_id');
            })
            ->where('is_active', true)
            ->where('days_from', '<=', $daysLate)
            ->where(function ($q) use ($daysLate) {
                $q->whereNull('days_to')->orWhere('days_to', '>=', $daysLate);
            })
            // Prefer class-group specific rules over session-wide, then highest days_from.
            ->orderByRaw('CASE WHEN class_section_group_id IS NULL THEN 1 ELSE 0 END')
            ->orderByDesc('days_from')
            ->first();

        if (! $rule) {
            return 0.0;
        }

        $amount = (float) $rule->amount;
        if ($rule->fine_type === 'per_day') {
            $amount = $amount * $daysLate;
        }
        if ($rule->max_cap !== null && $amount > (float) $rule->max_cap) {
            $amount = (float) $rule->max_cap;
        }

        return round($amount, 2);
    }

    /**
     * Apply late fines to overdue unpaid/partial invoices (set fine_amount and balance).
     * Skips invoices where fine was manually set/removed by staff.
     */
    public function applyLateFines(): int
    {
        $invoices = Invoice::query()
            ->where('due_date', '<', now()->toDateString())
            ->whereIn('status', ['unpaid', 'partial'])
            ->where('balance', '>', 0)
            ->where('fine_manual', false)
            ->get();

        $count = 0;
        foreach ($invoices as $invoice) {
            $totalFine = $this->calculateFineForInvoice($invoice);
            $previousFine = (float) $invoice->fine_amount;
            $delta = round($totalFine - $previousFine, 2);
            if ($delta <= 0) {
                continue;
            }

            DB::transaction(function () use ($invoice, $totalFine, $delta, &$count) {
                $invoice->refresh();
                if ($invoice->fine_manual) {
                    return;
                }

                $total = (float) $invoice->total_amount;
                $discount = (float) $invoice->discount_amount;
                $paid = (float) $invoice->paid_amount;
                $carried = (float) ($invoice->carried_forward_amount ?? 0);
                $payable = $total - $discount + $totalFine;
                $balance = max(0, round($payable - $paid - $carried, 2));
                $status = $balance <= 0.009
                    ? 'paid'
                    : ($paid > 0 ? 'partial' : 'unpaid');

                $invoice->update([
                    'fine_amount' => $totalFine,
                    'balance' => $balance,
                    'status' => $status,
                ]);

                $this->ledgerService->createEntry(
                    $invoice->student_enrollment_id,
                    'fine',
                    $delta,
                    0,
                    $invoice->id,
                    Invoice::class,
                    now()->format('Y-m-d')
                );
                $count++;
            });
        }

        return $count;
    }
}
