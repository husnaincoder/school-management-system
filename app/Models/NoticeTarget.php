<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NoticeTarget extends Model
{
    public const ALL_STUDENTS_IN_CLASS = 'All Students Enrolled in a Class';
    public const ALL_TEACHERS_TEACHING_CLASS = 'All Teachers Teaching a Class';
    public const ALL_PARENTS_OF_CLASS = 'All Parents of a Student enrolled in a Class';
    public const ALL_EMPLOYEES_IN_DEPARTMENT = 'All Employees Working in a Department';
    public const SINGLE_TEACHER = 'Specific teacher';
    public const SINGLE_EMPLOYEE = 'Specific employee';
    public const SINGLE_PARENT = 'Specific parent';
    public const SINGLE_STUDENT = 'Specific student';

    protected $fillable = ['notice_id', 'target_type'];

    public function notice(): BelongsTo
    {
        return $this->belongsTo(Notice::class);
    }

    public function details(): HasMany
    {
        return $this->hasMany(NoticeTagetDetail::class, 'notice_target_id');
    }
}
