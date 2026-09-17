<?php

namespace App\Services\Fee;

use App\Models\ClassFeeStructure;
use App\Models\Invoice;
use App\Models\Invoice_Item;
use App\Models\StudentEnrollment;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InvoiceService
{
    public function __construct(
        protected StudentLedgerService $ledgerService
    ) {}

    public function generateInvoiceNo(): string
    {
        $today = now()->format('Ymd');
        $count = Invoice::withTrashed()->whereDate('created_at', today())->count();
        $seq = str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
        return 'INV-' . $today . '-' . $seq;
    }

    /**
     * Check if invoice already exists for this enrollment and billing month.
     */
    public function hasInvoiceForBillingMonth(int $studentEnrollmentId, string $billingMonth): bool
    {
        return Invoice::where('student_enrollment_id', $studentEnrollmentId)
            ->where('billing_month', $billingMonth)
            ->exists();
    }

    /**
     * Balance = payable − paid − carried forward to a later invoice.
     *
     * @return array{payable: float, balance: float, status: string}
     */
    public function computePayableBalanceStatus(
        float $totalAmount,
        float $discountAmount,
        float $fineAmount,
        float $paidAmount,
        float $carriedForwardAmount = 0
    ): array {
        $payable = round($totalAmount - $discountAmount + $fineAmount, 2);
        $balance = round(max(0, $payable - $paidAmount - $carriedForwardAmount), 2);
        $status = $balance <= 0.009
            ? 'paid'
            : ($paidAmount > 0 ? 'partial' : 'unpaid');

        return [
            'payable' => $payable,
            'balance' => $balance,
            'status' => $status,
        ];
    }

    /**
     * Create a single invoice (manual or from auto). Optionally enforce duplicate check by billing_month.
     */
    public function createInvoice(
        StudentEnrollment $enrollment,
        string $issueDate,
        string $dueDate,
        float $totalAmount,
        float $discountAmount = 0,
        float $fineAmount = 0,
        ?string $billingMonth = null
    ): Invoice {
        if ($billingMonth !== null && $this->hasInvoiceForBillingMonth($enrollment->id, $billingMonth)) {
            throw new InvalidArgumentException('An invoice already exists for this student for billing period ' . $billingMonth . '.');
        }

        $computed = $this->computePayableBalanceStatus($totalAmount, $discountAmount, $fineAmount, 0, 0);

        return DB::transaction(function () use ($enrollment, $issueDate, $dueDate, $totalAmount, $discountAmount, $fineAmount, $billingMonth, $computed) {
            $invoice = Invoice::create([
                'invoice_no' => $this->generateInvoiceNo(),
                'student_enrollment_id' => $enrollment->id,
                'class_section_group_id' => $enrollment->class_section_group_id,
                'issue_date' => $issueDate,
                'due_date' => $dueDate,
                'billing_month' => $billingMonth,
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'fine_amount' => $fineAmount,
                'paid_amount' => 0,
                'carried_forward_amount' => 0,
                'balance' => $computed['balance'],
                'status' => 'unpaid',
            ]);
            $this->ledgerService->createEntry(
                $enrollment->id,
                'invoice',
                $totalAmount,
                0,
                $invoice->id,
                Invoice::class,
                $issueDate
            );
            if ($discountAmount > 0) {
                $this->ledgerService->createEntry(
                    $enrollment->id,
                    'discount',
                    0,
                    $discountAmount,
                    $invoice->id,
                    Invoice::class,
                    $issueDate
                );
            }
            return $invoice;
        });
    }

    /**
     * Add a line item and recalc total/balance.
     */
    public function addItem(Invoice $invoice, int $feeTypeId, ?string $description, float $amount): Invoice_Item
    {
        return DB::transaction(function () use ($invoice, $feeTypeId, $description, $amount) {
            $item = $invoice->items()->create([
                'fee_type_id' => $feeTypeId,
                'description' => $description,
                'amount' => $amount,
            ]);
            $this->recalculateInvoiceTotals($invoice);
            return $item;
        });
    }

    /**
     * Recalculate total from items, then balance (discount/fine/paid/carried from invoice).
     */
    public function recalculateInvoiceTotals(Invoice $invoice): void
    {
        $invoice->refresh();
        $total = (float) $invoice->items()->sum('amount');
        $discount = (float) $invoice->discount_amount;
        $fine = (float) $invoice->fine_amount;
        $paid = (float) $invoice->paid_amount;
        $carried = (float) ($invoice->carried_forward_amount ?? 0);
        $computed = $this->computePayableBalanceStatus($total, $discount, $fine, $paid, $carried);
        $invoice->update([
            'total_amount' => $total,
            'balance' => $computed['balance'],
            'status' => $computed['status'],
        ]);
    }

    /**
     * Recalculate discount from invoice_discounts sum, then balance.
     */
    public function recalculateDiscountAndBalance(Invoice $invoice): void
    {
        $invoice->refresh();
        $total = (float) $invoice->total_amount;
        $discount = (float) $invoice->discounts()->sum('calculated_amount');
        $fine = (float) $invoice->fine_amount;
        $paid = (float) $invoice->paid_amount;
        $carried = (float) ($invoice->carried_forward_amount ?? 0);
        $computed = $this->computePayableBalanceStatus($total, $discount, $fine, $paid, $carried);
        $invoice->update([
            'discount_amount' => $discount,
            'balance' => $computed['balance'],
            'status' => $computed['status'],
        ]);
    }

    /**
     * Manually set/remove invoice fine. Marks fine_manual so nightly auto late-fine skips this invoice.
     */
    public function updateFineAmount(Invoice $invoice, float $fineAmount, bool $manual = true): Invoice
    {
        return DB::transaction(function () use ($invoice, $fineAmount, $manual) {
            $invoice->refresh();
            $previousFine = (float) $invoice->fine_amount;
            $fineAmount = round(max(0, $fineAmount), 2);
            $delta = round($fineAmount - $previousFine, 2);

            $total = (float) $invoice->total_amount;
            $discount = (float) $invoice->discount_amount;
            $paid = (float) $invoice->paid_amount;
            $carried = (float) ($invoice->carried_forward_amount ?? 0);
            $computed = $this->computePayableBalanceStatus($total, $discount, $fineAmount, $paid, $carried);

            $invoice->update([
                'fine_amount' => $fineAmount,
                'fine_manual' => $manual,
                'balance' => $computed['balance'],
                'status' => $computed['status'],
            ]);

            if ($delta > 0) {
                $this->ledgerService->createEntry(
                    $invoice->student_enrollment_id,
                    'fine',
                    $delta,
                    0,
                    $invoice->id,
                    Invoice::class,
                    now()->format('Y-m-d')
                );
            } elseif ($delta < 0) {
                $this->ledgerService->createEntry(
                    $invoice->student_enrollment_id,
                    'fine',
                    0,
                    abs($delta),
                    $invoice->id,
                    Invoice::class,
                    now()->format('Y-m-d')
                );
            }

            return $invoice->fresh();
        });
    }

    /**
     * Soft-delete invoice and remove related line records.
     */
    public function deleteInvoice(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->payments()->delete();
            $invoice->refunds()->delete();
            $invoice->discounts()->delete();
            $invoice->items()->delete();
            $invoice->delete();
        });
    }
}
