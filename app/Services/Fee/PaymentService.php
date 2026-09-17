<?php

namespace App\Services\Fee;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentService
{
    public function __construct(
        protected StudentLedgerService $ledgerService
    ) {}

    public function recordPayment(
        Invoice $invoice,
        float $amount,
        string $method,
        ?string $transactionId,
        string $paymentDate
    ): Payment {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }
        $balance = (float) $invoice->balance;
        if ($amount > $balance) {
            throw new InvalidArgumentException('Payment amount cannot exceed invoice balance (' . $balance . ').');
        }
        if ($transactionId !== null && $transactionId !== '') {
            $exists = Payment::where('invoice_id', $invoice->id)->where('transaction_id', $transactionId)->exists();
            if ($exists) {
                throw new InvalidArgumentException('A payment with this transaction ID already exists for this invoice.');
            }
        }

        return DB::transaction(function () use ($invoice, $amount, $method, $transactionId, $paymentDate) {
            $payment = $invoice->payments()->create([
                'student_enrollment_id' => $invoice->student_enrollment_id,
                'amount' => $amount,
                'method' => $method,
                'transaction_id' => $transactionId,
                'payment_date' => $paymentDate,
            ]);
            $this->recalculateInvoicePaidAndBalance($invoice);
            $this->ledgerService->createEntry(
                $invoice->student_enrollment_id,
                'payment',
                0,
                $amount,
                $payment->id,
                Payment::class,
                $paymentDate
            );
            return $payment;
        });
    }

    public function voidPayment(Invoice $invoice, Payment $payment): void
    {
        if ((int) $payment->invoice_id !== (int) $invoice->id) {
            throw new InvalidArgumentException('Payment does not belong to this invoice.');
        }
        DB::transaction(function () use ($invoice, $payment) {
            $amount = (float) $payment->amount;
            $payment->delete();
            $this->recalculateInvoicePaidAndBalance($invoice);
            $this->ledgerService->createEntry(
                $invoice->student_enrollment_id,
                'payment',
                $amount,
                0,
                $payment->id,
                Payment::class,
                now()->format('Y-m-d')
            );
        });
    }

    public function recalculateInvoicePaidAndBalance(Invoice $invoice): void
    {
        $invoice->refresh();
        $total = (float) $invoice->total_amount;
        $discount = (float) $invoice->discount_amount;
        $fine = (float) $invoice->fine_amount;
        $paymentsTotal = (float) $invoice->payments()->sum('amount');
        $refundsTotal = (float) $invoice->refunds()->sum('amount');
        $paid = $paymentsTotal - $refundsTotal;
        $carried = (float) ($invoice->carried_forward_amount ?? 0);
        $payable = round($total - $discount + $fine, 2);
        $balance = round(max(0, $payable - $paid - $carried), 2);
        $status = $balance <= 0.009
            ? 'paid'
            : ($paid > 0 ? 'partial' : 'unpaid');
        $invoice->update([
            'paid_amount' => $paid,
            'balance' => $balance,
            'status' => $status,
        ]);
    }
}
