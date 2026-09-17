<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'hostel_id',
        'room_number',
        'floor',
        'capacity',
        'occupied_beds',
        'fee_per_bed',
        'is_active',
    ];

    protected $casts = [
        'fee_per_bed' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function hostel(): BelongsTo
    {
        return $this->belongsTo(Hostel::class);
    }

    public function hostelStudents(): HasMany
    {
        return $this->hasMany(HostelStudent::class);
    }

    public function getAvailableBedsAttribute(): int
    {
        return $this->capacity - $this->occupied_beds;
    }
}
