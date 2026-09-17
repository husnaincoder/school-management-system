<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoticeTagetDetail extends Model
{
    protected $table = 'notice_taget_details';

    protected $fillable = [
        'notice_target_id',
        'class_section_group_id',
        'student_enrollment_id',
        'teacher_id',
        'employee_id',
        'parent_id',
        'department',
    ];

    public function noticeTarget(): BelongsTo
    {
        return $this->belongsTo(NoticeTarget::class);
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'class_section_group_id');
    }

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }
}
