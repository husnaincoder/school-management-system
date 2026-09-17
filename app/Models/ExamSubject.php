<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamSubject extends Model
{
    protected $fillable = [
        'exam_id',
        'subject_id',
        'total_marks',
        'passing_marks',
        'is_optional',
        'sort_order',
        'exam_date',
        'start_time',
        'end_time',
        'room',
        'invigilator_teacher_id',
    ];

    protected $casts = [
        'total_marks' => 'integer',
        'passing_marks' => 'integer',
        'is_optional' => 'boolean',
        'sort_order' => 'integer',
        'exam_date' => 'date',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Date-sheet invigilator (proctor) — separate from class subject teacher.
     */
    public function invigilator(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'invigilator_teacher_id');
    }

    public function studentExamRecords(): HasMany
    {
        return $this->hasMany(StudentExamRecord::class);
    }
}
