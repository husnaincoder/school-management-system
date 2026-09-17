<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class OvertimePayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'overtime_payments';

    protected $fillable = [
        'employee_id',
        'teacher_id',
        'month',
        'year',
        'hours',
        'rate_per_hour',
        'amount',
        'payroll_id',
        'status',
        'remarks',
    ];

    protected $casts = [
        'hours' => 'decimal:2',
        'rate_per_hour' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }
}
