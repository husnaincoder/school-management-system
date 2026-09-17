<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentInstallment extends Model
{
    use HasFactory;

    protected $table = 'student_installments';

    protected $fillable = [
        'student_enrollment_id',
        'installment_plan_id',
        'total_amount',
        'start_billing_month',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function installmentPlan(): BelongsTo
    {
        return $this->belongsTo(InstallmentPlan::class, 'installment_plan_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(StudentInstallmentSchedule::class, 'student_installment_id')
            ->orderBy('installment_no');
    }
}
