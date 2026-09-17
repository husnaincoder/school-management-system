<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\Fee\PaymentService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function store(Request $request, Invoice $invoice)
    {
        $this->authorize('create', [Payment::class, $invoice]);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:cash,bank,card,online,cheque',
            'transaction_id' => 'nullable|string|max:255',
            'payment_date' => 'required|date',
        ], [
            'amount.required' => 'Amount is required.',
            'method.required' => 'Please select payment method.',
            'payment_date.required' => 'Payment date is required.',
        ]);

        try {
            $payment = $this->paymentService->recordPayment(
                $invoice,
                (float) $validated['amount'],
                $validated['method'],
                $validated['transaction_id'] ?? null,
                $validated['payment_date']
            );
        } catch (InvalidArgumentException $e) {
            if ($request->expectsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return back()->with('error', $e->getMessage());
        }

        $invoice->refresh();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Payment recorded.',
                'payment' => $payment,
                'invoice' => [
                    'id' => $invoice->id,
                    'status' => $invoice->status,
                    'paid_amount' => (float) $invoice->paid_amount,
                    'balance' => (float) $invoice->balance,
                    'total_amount' => (float) $invoice->total_amount,
                ],
            ]);
        }

        return back()->with('success', 'Payment recorded.');
    }

    public function destroy(Invoice $invoice, Payment $payment)
    {
        $this->authorize('delete', $payment);

        if ((int) $payment->invoice_id !== (int) $invoice->id) {
            abort(404);
        }

        try {
            $this->paymentService->voidPayment($invoice, $payment);
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Payment removed.');
    }
}
