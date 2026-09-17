<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoices';

    protected $fillable = [
        'invoice_no',
        'student_enrollment_id',
        'class_section_group_id',
        'issue_date',
        'due_date',
        'billing_month',
        'total_amount',
        'discount_amount',
        'fine_amount',
        'fine_manual',
        'paid_amount',
        'carried_forward_amount',
        'carried_forward_to_invoice_id',
        'balance',
        'status',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'total_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'fine_amount' => 'decimal:2',
        'fine_manual' => 'boolean',
        'paid_amount' => 'decimal:2',
        'carried_forward_amount' => 'decimal:2',
        'balance' => 'decimal:2',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    /** Alias used by fee services. */
    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_enrollment_id');
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'class_section_group_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Invoice_Item::class, 'invoice_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'invoice_id');
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(InvoiceDiscount::class, 'invoice_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'invoice_id');
    }

    public function carriedForwardTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'carried_forward_to_invoice_id');
    }
}
