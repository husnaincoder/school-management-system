<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_number',
        'vehicle_name',
        'driver_name',
        'driver_phone',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function routes(): HasMany
    {
        return $this->hasMany(TransportRoute::class);
    }

    public function studentTransports(): HasMany
    {
        return $this->hasMany(StudentTransport::class);
    }
}
