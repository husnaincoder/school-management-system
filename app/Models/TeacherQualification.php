<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeacherQualification extends Model
{
    use SoftDeletes;

    protected $table = 'teacher_qualifications';

    protected $fillable = [
        'teacher_id',
        'degree_name',
        'field_of_study',
        'board_university',
        'passing_year',
        'grade_division',
        'certificate_image',
    ];

    protected $casts = [
        'passing_year' => 'integer',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
