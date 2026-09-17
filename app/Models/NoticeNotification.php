<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoticeNotification extends Model
{
    protected $fillable = [
        'notice_id',
        'user_id',
        'employee_id',
        'teacher_id',
        'parent_id',
        'class_section_group_id',
        'student_enrollment_id',
        'notification_at',
        'is_seen',
    ];

    protected $casts = [
        'notification_at' => 'datetime',
        'is_seen' => 'boolean',
    ];

    public function notice(): BelongsTo
    {
        return $this->belongsTo(Notice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
