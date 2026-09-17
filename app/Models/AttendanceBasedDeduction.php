<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceBasedDeduction extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'attendance_based_deductions';

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'teacher_id',
        'working_days',
        'present_days',
        'absent_days',
        'late_days',
        'leave_days',
        'paid_leave_days',
        'leave_without_pay_days',
        'overtime_hours',
        'amount_deducted',
        'remarks',
    ];

    protected $casts = [
        'working_days' => 'integer',
        'present_days' => 'integer',
        'absent_days' => 'integer',
        'late_days' => 'integer',
        'leave_days' => 'integer',
        'paid_leave_days' => 'integer',
        'leave_without_pay_days' => 'integer',
        'overtime_hours' => 'decimal:2',
        'amount_deducted' => 'decimal:2',
    ];

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}

