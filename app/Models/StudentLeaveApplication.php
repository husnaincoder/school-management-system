<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentLeaveApplication extends Model
{
    protected $table = 'student_leave_applications';

    protected $fillable = [
        'student_enrollment_id',
        'class_section_group_id',
        'from_date',
        'to_date',
        'total_days',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'remarks',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class);
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
