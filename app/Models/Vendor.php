<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $table = 'vendors';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company_name',
        'address',
    ];

    /**
     * Get the expenses associated with this vendor.
     */
    public function expenses()
    {
        return $this->hasMany(Expense::class, 'vendor_id');
    }
}
