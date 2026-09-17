<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentScholarShip extends Model
{
    use HasFactory;

    protected $table = 'student_scholar_ships';

    protected $fillable = [
        'student_enrollment_id',
        'scholarship_id',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function scholarship(): BelongsTo
    {
        return $this->belongsTo(ScholarShip::class, 'scholarship_id');
    }
}
