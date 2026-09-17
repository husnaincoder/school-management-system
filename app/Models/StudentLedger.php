<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentLedger extends Model
{
    protected $table = 'student_ledgers';

    protected $fillable = [
        'student_enrollment_id',
        'type',
        'debit',
        'credit',
        'running_balance',
        'reference_id',
        'reference_type',
        'date',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'running_balance' => 'decimal:2',
        'date' => 'date',
    ];

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }
}
