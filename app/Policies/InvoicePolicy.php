<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('fee.invoice.view') || $user->can('fee.own.view') || $user->can('fee.own.children.view');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        if ($user->can('fee.invoice.view')) {
            return true;
        }
        $invoice->load('enrollment.student');
        $enrollment = $invoice->enrollment;
        if (!$enrollment || !$enrollment->student) {
            return false;
        }
        if ($user->can('fee.own.view') && $user->student && (int) $user->student->id === (int) $enrollment->student_id) {
            return true;
        }
        if ($user->can('fee.own.children.view') && $user->parent && (int) $enrollment->student->parent_id === (int) $user->parent->id) {
            return true;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('fee.invoice.create');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $user->can('fee.invoice.edit');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->can('fee.invoice.delete');
    }
}
