<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\Fee\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class InvoiceApiController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['enrollment.student']);
        if ($request->user()->can('fee.invoice.view')) {
            // no scope
        } elseif ($request->user()->can('fee.own.view')) {
            $query->whereHas('enrollment', fn ($q) => $q->where('student_id', $request->user()->student?->id));
        } elseif ($request->user()->can('fee.own.children.view')) {
            $query->whereHas('enrollment.student', fn ($q) => $q->where('parent_id', $request->user()->parent?->id));
        } else {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $invoices = $query->latest('issue_date')->paginate(15);
        return response()->json(InvoiceResource::collection($invoices));
    }

    public function show(Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);
        $invoice->load(['items', 'payments', 'enrollment.student']);
        return response()->json(new InvoiceResource($invoice));
    }

    public function storePayment(StorePaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('create', [\App\Models\Payment::class, $invoice]);
        try {
            $payment = $this->paymentService->recordPayment(
                $invoice,
                (float) $request->amount,
                $request->method,
                $request->transaction_id,
                $request->payment_date
            );
            return response()->json(['message' => 'Payment recorded', 'payment_id' => $payment->id], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
