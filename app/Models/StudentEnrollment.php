<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentEnrollment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'student_enrollments';

    protected $fillable = [
        'student_id',
        'class_section_group_id',
        'roll_number',
        'admission_date',
        'status',
    ];

    protected $casts = [
        'student_id' => 'integer',
        'class_section_group_id' => 'integer',
        'admission_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'class_section_group_id');
    }

    public function studentAttendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class, 'student_enrollment_id');
    }

    public function leaveApplications(): HasMany
    {
        return $this->hasMany(StudentLeaveApplication::class, 'student_enrollment_id');
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class, 'student_enrollment_id');
    }

    public function remarks(): HasMany
    {
        return $this->hasMany(StudentRemark::class, 'student_enrollment_id');
    }

    public function studentScholarShips(): HasMany
    {
        return $this->hasMany(StudentScholarShip::class, 'student_enrollment_id');
    }

    public function studentInstallments(): HasMany
    {
        return $this->hasMany(StudentInstallment::class, 'student_enrollment_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'student_enrollment_id');
    }

    public function ledgers(): HasMany
    {
        return $this->hasMany(StudentLedger::class, 'student_enrollment_id');
    }

    public function studentExamRecords(): HasMany
    {
        return $this->hasMany(StudentExamRecord::class, 'student_enrollment_id');
    }

    public function studentExamResults(): HasMany
    {
        return $this->hasMany(StudentExamResult::class);
    }

    /**
     * Create a new enrollment, or restore + update a soft-deleted one for the same student.
     * Needed because student_enrollments.student_id is unique including soft-deleted rows.
     *
     * @param  array{student_id: int, class_section_group_id: int, roll_number?: ?string, admission_date?: mixed, status?: string}  $attributes
     */
    public static function enrollOrRestore(array $attributes): self
    {
        $enrollment = static::withTrashed()
            ->where('student_id', $attributes['student_id'])
            ->first();

        if ($enrollment) {
            if ($enrollment->trashed()) {
                $enrollment->restore();
            }

            $enrollment->update([
                'class_section_group_id' => $attributes['class_section_group_id'],
                'roll_number' => $attributes['roll_number'] ?? $enrollment->roll_number,
                'admission_date' => $attributes['admission_date'] ?? $enrollment->admission_date,
                'status' => $attributes['status'] ?? 'active',
            ]);

            return $enrollment->fresh();
        }

        return static::create([
            'student_id' => $attributes['student_id'],
            'class_section_group_id' => $attributes['class_section_group_id'],
            'roll_number' => $attributes['roll_number'] ?? null,
            'admission_date' => $attributes['admission_date'] ?? null,
            'status' => $attributes['status'] ?? 'active',
        ]);
    }
}
