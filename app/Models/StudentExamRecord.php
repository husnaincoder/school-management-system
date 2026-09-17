<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentExamRecord extends Model
{
    public const ATTENDANCE_PRESENT = 'present';
    public const ATTENDANCE_ABSENT = 'absent';
    public const ATTENDANCE_LEAVE = 'leave';

    protected $fillable = [
        'exam_subject_id',
        'student_enrollment_id',
        'entered_by',
        'obtained_marks',
        'attendance_status',
        'absent_reason',
    ];

    protected $casts = [
        'obtained_marks' => 'decimal:2',
    ];

    public function examSubject(): BelongsTo
    {
        return $this->belongsTo(ExamSubject::class);
    }

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function enteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'entered_by');
    }
}
