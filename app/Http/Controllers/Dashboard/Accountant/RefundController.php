<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Fee\RefundService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class RefundController extends Controller
{
    public function __construct(
        protected RefundService $refundService
    ) {}

    public function store(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        try {
            $this->refundService->refund(
                $invoice,
                (float) $validated['amount'],
                $validated['reason'] ?? null
            );
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Refund processed.');
    }
}
