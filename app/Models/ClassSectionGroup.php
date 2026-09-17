<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSectionGroup extends Model
{
    use HasFactory;

    protected $table = 'class_section_groups';

    protected $fillable = [
        'class_section_id',
        'subject_group_id',
    ];

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class);
    }

    public function subjectGroup(): BelongsTo
    {
        return $this->belongsTo(SubjectGroup::class, 'subject_group_id');
    }

    public function classSectionGroupSubjects(): HasMany
    {
        return $this->hasMany(ClassSectionGroupSubject::class, 'class_section_group_id');
    }

    public function classIncharges(): HasMany
    {
        // Incharges are assigned at class_section level; expose via matching class_section_id.
        return $this->hasMany(ClassIncharge::class, 'class_section_id', 'class_section_id');
    }

    public function studentEnrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class, 'class_section_group_id');
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'class_section_group_id');
    }

    public function lateFineRules(): HasMany
    {
        return $this->hasMany(LateFineRule::class, 'class_section_group_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'class_section_group_id');
    }

    public function timetables(): HasMany
    {
        return $this->hasMany(Timetable::class, 'class_section_group_id');
    }
}
