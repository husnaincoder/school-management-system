<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentInstallmentSchedule extends Model
{
    protected $table = 'student_installment_schedules';

    protected $fillable = [
        'student_installment_id',
        'installment_no',
        'amount',
        'billing_month',
        'due_date',
        'invoice_id',
    ];

    protected $casts = [
        'installment_no' => 'integer',
        'amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function studentInstallment(): BelongsTo
    {
        return $this->belongsTo(StudentInstallment::class, 'student_installment_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}
