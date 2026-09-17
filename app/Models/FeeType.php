<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ClassFeeStructure;

class FeeType extends Model
{
    use HasFactory;

    protected $table = 'fee_types';

    public const CATEGORIES = ['tuition', 'one_time', 'monthly', 'fine', 'optional'];

    protected $fillable = [
        'name',
        'category',
        'is_refundable',
    ];

    protected $casts = [
        'is_refundable' => 'boolean',
    ];

    public function classFeeStructures(): HasMany
    {
        return $this->hasMany(ClassFeeStructure::class);
    }
}
