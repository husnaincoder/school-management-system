<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->foreignId('allowance_id')->nullable()->change();
            $table->foreignId('deduction_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->foreignId('allowance_id')->nullable(false)->change();
            $table->foreignId('deduction_id')->nullable(false)->change();
        });
    }
};
