<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalaryAdvance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'teacher_id',
        'amount',
        'request_date',
        'approved_date',
        'status',
        'recovery_payroll_id',
        'recovered_amount',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'recovered_amount' => 'decimal:2',
        'request_date' => 'date',
        'approved_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function recoveryPayroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'recovery_payroll_id');
    }
}
