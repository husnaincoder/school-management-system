<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ScholarShip extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'scholar_ships';

    protected $fillable = [
        'name',
        'type',   // 'percentage' or 'fixed'
        'value',  // numeric amount or percentage
    ];

    protected $casts = [
        'value' => 'decimal:2',
    ];

    /**
     * Student enrollments that have this scholarship assigned.
     */
    public function studentScholarShips(): HasMany
    {
        return $this->hasMany(StudentScholarShip::class, 'scholarship_id');
    }
}
