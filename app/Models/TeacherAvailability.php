<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherAvailability extends Model
{
    /** Table name has typo in migration: teacher_availabilties */
    protected $table = 'teacher_availabilties';

    public const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    protected $fillable = [
        'teacher_id',
        'day',
        'time_slot_id',
        'class_room_id', // kept nullable for legacy rows; not used in UI
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(ClassRoom::class);
    }
}
