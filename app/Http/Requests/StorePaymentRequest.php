<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('fee.payment.process');
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'method' => 'required|in:cash,bank,card,online,cheque',
            'transaction_id' => 'nullable|string|max:255',
            'payment_date' => 'required|date',
        ];
    }
}
