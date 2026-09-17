<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'students';

    protected $fillable = [
        'user_id',
        'parent_id',
        'sibling_discount_eligible',
        'first_name',
        'last_name',
        'cnic',
        'profile_photo',
        'admission_number',
        'date_of_birth',
        'gender',
        'address',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'sibling_discount_eligible' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    /** Current enrollment (one active row per student — soft-deleted rows excluded). */
    public function enrollment(): HasOne
    {
        return $this->hasOne(StudentEnrollment::class)->latestOfMany();
    }

    public function marks(): HasMany
    {
        return $this->hasMany(Mark::class);
    }

    public function feeAssignments(): HasMany
    {
        return $this->hasMany(FeeAssignment::class);
    }

    public function feePayments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }

    public function transport(): HasOne
    {
        return $this->hasOne(StudentTransport::class);
    }

    public function hostel(): HasOne
    {
        return $this->hasOne(HostelStudent::class);
    }

    public function bookIssues(): HasMany
    {
        return $this->hasMany(BookIssue::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function getFullNameAttribute(): string
    {
        $name = trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
        return $name !== '' ? $name : ($this->user?->name ?? '');
    }
}
