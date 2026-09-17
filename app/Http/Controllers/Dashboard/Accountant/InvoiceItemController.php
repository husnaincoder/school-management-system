<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Invoice_Item;
use App\Services\Fee\InvoiceService;
use Illuminate\Http\Request;

class InvoiceItemController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    public function store(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'fee_type_id' => 'required|exists:fee_types,id',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
        ], [
            'fee_type_id.required' => 'Please select a fee type.',
            'amount.required' => 'Amount is required.',
        ]);

        $this->invoiceService->addItem(
            $invoice,
            (int) $validated['fee_type_id'],
            $validated['description'] ?? null,
            (float) $validated['amount']
        );

        return back()->with('success', 'Line item added.');
    }

    public function update(Request $request, Invoice $invoice, Invoice_Item $invoice_item)
    {
        if ((int) $invoice_item->invoice_id !== (int) $invoice->id) {
            abort(404);
        }

        $validated = $request->validate([
            'fee_type_id' => 'required|exists:fee_types,id',
            'description' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
        ], [
            'fee_type_id.required' => 'Please select a fee type.',
            'amount.required' => 'Amount is required.',
        ]);

        $invoice_item->update($validated);
        $this->invoiceService->recalculateInvoiceTotals($invoice);

        return back()->with('success', 'Line item updated.');
    }

    public function destroy(Invoice $invoice, Invoice_Item $invoice_item)
    {
        if ((int) $invoice_item->invoice_id !== (int) $invoice->id) {
            abort(404);
        }

        $invoice_item->delete();
        $this->invoiceService->recalculateInvoiceTotals($invoice);

        return back()->with('success', 'Line item removed.');
    }
}
