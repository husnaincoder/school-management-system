<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParentModel extends Model
{
    use HasFactory;

    protected $table = 'parents';

    protected $fillable = [
        'user_id',
        'spouse_name',
        'relation_with_student',
        'father_cnic',
        'spouse_cnic',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'occupation',
        'monthly_income',
        'photo',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'monthly_income' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'parent_id');
    }
}
