<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeacherAttendance extends Model
{
    use SoftDeletes;

    protected $table = 'teacher_attendances';

    public const STATUS_PRESENT = 'present';
    public const STATUS_ABSENT = 'absent';
    public const STATUS_LATE = 'late';
    public const STATUS_LEAVE = 'leave';

    protected $fillable = [
        'attendance_session_id',
        'teacher_id',
        'status',
        'check_in',
        'check_out',
        'remarks',
    ];

    protected $casts = [
        'check_in' => 'datetime:H:i',
        'check_out' => 'datetime:H:i',
    ];

    public function attendanceSession(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
