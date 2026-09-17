<?php

namespace App\Policies;

use App\Models\Payroll;
use App\Models\User;

class PayrollPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('payroll.view') || $user->hasAnyRole(['super_admin', 'admin', 'accountant']);
    }

    public function view(User $user, Payroll $payroll): bool
    {
        if ($user->can('payroll.view') || $user->hasAnyRole(['super_admin', 'admin', 'accountant'])) {
            return true;
        }

        return $this->ownsPayroll($user, $payroll);
    }

    public function generate(User $user): bool
    {
        return $user->can('payroll.generate') || $user->hasAnyRole(['super_admin', 'admin', 'accountant']);
    }

    public function approve(User $user, ?Payroll $payroll = null): bool
    {
        return $user->can('payroll.approve') || $user->hasAnyRole(['super_admin', 'admin', 'accountant']);
    }

    public function pay(User $user, ?Payroll $payroll = null): bool
    {
        return $user->can('payroll.pay') || $user->hasAnyRole(['super_admin', 'admin', 'accountant']);
    }

    public function cancel(User $user, Payroll $payroll): bool
    {
        return $user->can('payroll.approve') || $user->hasAnyRole(['super_admin', 'admin']);
    }

    public function downloadSlip(User $user, Payroll $payroll): bool
    {
        if ($user->can('salary_slip.download') || $user->hasAnyRole(['super_admin', 'admin', 'accountant'])) {
            return true;
        }

        return $this->ownsPayroll($user, $payroll);
    }

    public function manageStructure(User $user): bool
    {
        return $user->can('salary_structure.manage') || $user->hasAnyRole(['super_admin', 'admin', 'accountant']);
    }

    protected function ownsPayroll(User $user, Payroll $payroll): bool
    {
        if ($payroll->employee_id && $user->employee?->id === (int) $payroll->employee_id) {
            return true;
        }
        if ($payroll->teacher_id && $user->teacher?->id === (int) $payroll->teacher_id) {
            return true;
        }

        return false;
    }
}
