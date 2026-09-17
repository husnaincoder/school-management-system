<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Leave extends Model
{
    protected $fillable = [
        'leave_type_id',
        'student_enrollment_id',
        'teacher_id',
        'employee_id',
        'start_date',
        'end_date',
        'total_days',
        'reason',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'total_days' => 'integer',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function leaveDays(): HasMany
    {
        return $this->hasMany(LeaveDay::class);
    }

    public function leaveApprovals(): HasMany
    {
        return $this->hasMany(LeaveApproval::class);
    }

    /** Get the applicant name (student via enrollment, teacher, or employee). */
    public function getApplicantNameAttribute(): ?string
    {
        if ($this->student_enrollment_id && $this->studentEnrollment) {
            return $this->studentEnrollment->student->full_name ?? null;
        }
        if ($this->teacher_id && $this->teacher) {
            return $this->teacher->user->name ?? null;
        }
        if ($this->employee_id && $this->employee) {
            return $this->employee->user->name ?? null;
        }
        return null;
    }

    /** Applicant type: student, teacher, employee */
    public function getApplicantTypeAttribute(): ?string
    {
        if ($this->student_enrollment_id) return 'student';
        if ($this->teacher_id) return 'teacher';
        if ($this->employee_id) return 'employee';
        return null;
    }
}
