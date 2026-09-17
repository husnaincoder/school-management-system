<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceDiscount extends Model
{
    protected $table = 'invoice_discounts';

    protected $fillable = [
        'invoice_id',
        'type',
        'value',
        'calculated_amount',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'calculated_amount' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }
}
