<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceSession extends Model
{
    use SoftDeletes;

    protected $table = 'attendance_sessions';

    public const TYPE_STUDENT = 'student';
    public const TYPE_TEACHER = 'teacher';
    public const TYPE_EMPLOYEE = 'employee';

    protected $fillable = [
        'attendance_date',
        'academic_session_id',
        'class_section_group_id',
        'type',
        'is_locked',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'is_locked' => 'boolean',
    ];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'class_section_group_id');
    }

    public function studentAttendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class, 'attendance_session_id');
    }

    public function teacherAttendances(): HasMany
    {
        return $this->hasMany(TeacherAttendance::class, 'attendance_session_id');
    }

    public function employeeAttendances(): HasMany
    {
        return $this->hasMany(EmployeeAttendance::class, 'attendance_session_id');
    }
}
