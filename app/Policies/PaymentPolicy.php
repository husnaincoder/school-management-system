<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function create(User $user, Invoice $invoice): bool
    {
        return $user->can('fee.payment.process');
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->can('fee.payment.void');
    }
}
