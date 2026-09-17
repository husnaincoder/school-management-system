<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payroll extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'payrolls';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_GENERATED = 'generated';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PAID = 'paid';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'employee_id',
        'teacher_id',
        'month',
        'year',
        'basic_salary',
        'total_allowances',
        'total_deductions',
        'net_salary',
        'status',
        'working_days',
        'present_days',
        'absent_days',
        'late_days',
        'leave_days',
        'paid_leave_days',
        'unpaid_leave_days',
        'overtime_hours',
        'leave_deduction_amount',
        'payment_date',
        'payment_method',
        'transaction_id',
        'remarks',
        'is_active',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'total_allowances' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'leave_deduction_amount' => 'decimal:2',
        'working_days' => 'integer',
        'present_days' => 'integer',
        'absent_days' => 'integer',
        'late_days' => 'integer',
        'leave_days' => 'integer',
        'paid_leave_days' => 'integer',
        'unpaid_leave_days' => 'integer',
        'payment_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function payslip(): HasOne
    {
        return $this->hasOne(Payslip::class);
    }

    public function attendanceDeduction(): HasOne
    {
        return $this->hasOne(AttendanceBasedDeduction::class);
    }

    public function staffType(): string
    {
        return $this->teacher_id ? 'Teacher' : 'Employee';
    }

    public function staffName(): string
    {
        if ($this->employee_id) {
            return $this->employee?->user?->name ?? '—';
        }

        return $this->teacher?->user?->name ?? '—';
    }

    public function staffIdentifier(): string
    {
        if ($this->employee_id) {
            return $this->employee?->employee_id ?? '—';
        }

        return $this->teacher?->staff_id ?? '—';
    }
}
