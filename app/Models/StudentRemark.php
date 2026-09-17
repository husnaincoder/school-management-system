<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRemark extends Model
{
    protected $table = 'student_remarks';

    public const TYPE_REMARK = 'remark';
    public const TYPE_WARNING = 'warning';
    public const TYPE_BEHAVIOR = 'behavior';
    public const TYPE_PARENT_MEETING = 'parent_meeting';

    protected $fillable = [
        'student_enrollment_id',
        'class_section_group_id',
        'type',
        'body',
        'recorded_by',
        'remark_date',
    ];

    protected $casts = [
        'remark_date' => 'date',
    ];

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class);
    }

    public function recordedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
