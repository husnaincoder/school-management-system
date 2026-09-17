<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceDiscount;
use App\Services\Fee\InvoiceService;
use Illuminate\Http\Request;

class InvoiceDiscountController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Add a discount to an invoice.
     */
    public function store(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
        ], [
            'type.required' => 'Please select discount type.',
            'value.required' => 'Value is required.',
        ]);

        $total = (float) $invoice->total_amount;
        $value = (float) $validated['value'];

        $calculated = match ($validated['type']) {
            'percentage' => round($total * $value / 100, 2),
            'fixed' => min($value, $total),
        };

        $invoice->discounts()->create([
            'type' => $validated['type'],
            'value' => $value,
            'calculated_amount' => $calculated,
        ]);

        $this->invoiceService->recalculateDiscountAndBalance($invoice);

        return back()->with('success', 'Discount added.');
    }

    /**
     * Update an invoice discount.
     */
    public function update(Request $request, Invoice $invoice, InvoiceDiscount $invoice_discount)
    {
        if ((int) $invoice_discount->invoice_id !== (int) $invoice->id) {
            abort(404);
        }

        $validated = $request->validate([
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
        ], [
            'type.required' => 'Please select discount type.',
            'value.required' => 'Value is required.',
        ]);

        $total = (float) $invoice->total_amount;
        $value = (float) $validated['value'];

        $calculated = match ($validated['type']) {
            'percentage' => round($total * $value / 100, 2),
            'fixed' => min($value, $total),
        };

        $invoice_discount->update([
            'type' => $validated['type'],
            'value' => $value,
            'calculated_amount' => $calculated,
        ]);

        $this->invoiceService->recalculateDiscountAndBalance($invoice);

        return back()->with('success', 'Discount updated.');
    }

    /**
     * Remove an invoice discount.
     */
    public function destroy(Invoice $invoice, InvoiceDiscount $invoice_discount)
    {
        if ((int) $invoice_discount->invoice_id !== (int) $invoice->id) {
            abort(404);
        }

        $invoice_discount->delete();
        $this->invoiceService->recalculateDiscountAndBalance($invoice);

        return back()->with('success', 'Discount removed.');
    }
}
