<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportRoute extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_name',
        'start_point',
        'end_point',
        'pickup_points',
        'monthly_fee',
        'vehicle_id',
        'is_active',
    ];

    protected $casts = [
        'monthly_fee' => 'decimal:2',
        'is_active' => 'boolean',
        'pickup_points' => 'array',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function studentTransports(): HasMany
    {
        return $this->hasMany(StudentTransport::class, 'route_id');
    }
}
