<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Teacher extends Model
{
    use SoftDeletes;

    protected $table = 'teachers';

    protected $fillable = [
        'user_id',
        'staff_id',
        'department',
        'designation',
        'joining_date',
        'specialization',
        'experience',
        'basic_salary',
        'cv',
        'id_card_front',
        'id_card_back',
        'status',
        'address',
        'emergency_contact',
        'emergency_phone',
        'photo',
        'is_active',
    ];

    protected $casts = [
        'joining_date' => 'date',
        'basic_salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function qualifications(): HasMany
    {
        return $this->hasMany(TeacherQualification::class)->orderBy('passing_year', 'desc');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(TeacherAttendance::class, 'teacher_id');
    }

    public function classIncharges(): HasMany
    {
        return $this->hasMany(ClassIncharge::class, 'teacher_id');
    }

    public function activeClassIncharges(): HasMany
    {
        return $this->hasMany(ClassIncharge::class, 'teacher_id')->where('is_active', true);
    }

    public function salaryStructure(): HasOne
    {
        return $this->hasOne(SalaryStructure::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function salaryAdvances(): HasMany
    {
        return $this->hasMany(SalaryAdvance::class);
    }

    public function overtimePayments(): HasMany
    {
        return $this->hasMany(OvertimePayment::class);
    }

    public function attendanceDeductions(): HasMany
    {
        return $this->hasMany(AttendanceBasedDeduction::class);
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }
}
