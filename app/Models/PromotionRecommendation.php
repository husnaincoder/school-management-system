<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromotionRecommendation extends Model
{
    protected $fillable = [
        'student_enrollment_id',
        'class_section_id',
        'recommended_by',
        'recommendation',
        'remarks',
        'status',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class);
    }

    public function recommendedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recommended_by');
    }
}
