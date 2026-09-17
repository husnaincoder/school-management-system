<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hostel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'address',
        'warden_name',
        'warden_phone',
        'total_rooms',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function hostelStudents(): HasMany
    {
        return $this->hasMany(HostelStudent::class);
    }
}
