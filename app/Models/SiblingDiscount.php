<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiblingDiscount extends Model
{
    use HasFactory;

    protected $table = 'sibling_discounts';

    protected $fillable = [
        'percentage',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
    ];
}
