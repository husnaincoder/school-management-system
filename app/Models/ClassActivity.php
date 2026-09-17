<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassActivity extends Model
{
    protected $fillable = [
        'class_section_id',
        'title',
        'description',
        'activity_date',
        'location',
        'created_by',
    ];

    protected $casts = [
        'activity_date' => 'date',
    ];

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
