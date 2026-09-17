<?php

namespace App\Services\Fee;

use App\Models\Invoice;
use App\Models\Refund;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RefundService
{
    public function __construct(
        protected StudentLedgerService $ledgerService
    ) {}

    /**
     * Process refund. Refund amount cannot exceed paid_amount.
     */
    public function refund(Invoice $invoice, float $amount, ?string $reason = null): Refund
    {
        $paid = (float) $invoice->paid_amount;
        if ($amount <= 0) {
            throw new InvalidArgumentException('Refund amount must be greater than zero.');
        }
        if ($amount > $paid) {
            throw new InvalidArgumentException('Refund amount cannot exceed paid amount (' . $paid . ').');
        }

        return DB::transaction(function () use ($invoice, $amount, $reason) {
            $refund = Refund::create([
                'invoice_id' => $invoice->id,
                'student_enrollment_id' => $invoice->student_enrollment_id,
                'amount' => $amount,
                'reason' => $reason,
            ]);
            $paymentService = app(\App\Services\Fee\PaymentService::class);
            $paymentService->recalculateInvoicePaidAndBalance($invoice);
            $this->ledgerService->createEntry(
                $invoice->student_enrollment_id,
                'refund',
                0,
                $amount,
                $refund->id,
                Refund::class,
                now()->format('Y-m-d')
            );
            return $refund;
        });
    }
}
