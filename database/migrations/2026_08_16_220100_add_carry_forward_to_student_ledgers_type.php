<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE student_ledgers MODIFY COLUMN type ENUM('invoice', 'payment', 'fine', 'refund', 'discount', 'carry_forward') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE student_ledgers MODIFY COLUMN type ENUM('invoice', 'payment', 'fine', 'refund', 'discount') NOT NULL");
        }
    }
};
