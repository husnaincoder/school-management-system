<?php

namespace App\Services\Fee;

use App\Models\StudentEnrollment;
use App\Models\StudentLedger;
use Illuminate\Support\Facades\DB;

class StudentLedgerService
{
    /**
     * Create a ledger entry and update running balance.
     * Debit = charge (invoice, fine), Credit = payment (payment, refund, discount).
     */
    public function createEntry(
        int $studentEnrollmentId,
        string $type,
        float $debit,
        float $credit,
        ?int $referenceId = null,
        ?string $referenceType = null,
        ?string $date = null
    ): StudentLedger {
        return DB::transaction(function () use ($studentEnrollmentId, $type, $debit, $credit, $referenceId, $referenceType, $date) {
            $date = $date ?? now()->format('Y-m-d');
            $prev = StudentLedger::where('student_enrollment_id', $studentEnrollmentId)
                ->where('date', '<=', $date)
                ->orderByDesc('date')
                ->orderByDesc('id')
                ->first();
            $prevBalance = $prev ? (float) $prev->running_balance : 0.0;
            $runningBalance = $prevBalance + (float) $debit - (float) $credit;

            return StudentLedger::create([
                'student_enrollment_id' => $studentEnrollmentId,
                'type' => $type,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
                'reference_id' => $referenceId,
                'reference_type' => $referenceType,
                'date' => $date,
            ]);
        });
    }
}
