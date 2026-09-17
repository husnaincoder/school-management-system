<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassRoom extends Model
{
    public const ROOM_TYPES = [
        'classroom',
        'laboratory',
        'computer_lab',
        'auditorium',
        'library',
        'hall',
    ];

    public const FACILITIES = [
        'projector',
        'ac',
        'smart_board',
        'computers',
    ];

    protected $fillable = [
        'name',
        'code',
        'building',
        'floor',
        'room_type',
        'capacity',
        'is_lab',
        'facilities',
        'is_active',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'is_lab' => 'boolean',
        'is_active' => 'boolean',
        'facilities' => 'array',
    ];

    public function timetableEnters(): HasMany
    {
        return $this->hasMany(TimetableEnter::class, 'class_room_id');
    }
}
