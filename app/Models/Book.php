<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'isbn',
        'category',
        'publisher',
        'edition',
        'quantity',
        'available_quantity',
        'price',
        'rack_number',
        'is_active',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'available_quantity' => 'integer',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function bookIssues(): HasMany
    {
        return $this->hasMany(BookIssue::class);
    }
}
