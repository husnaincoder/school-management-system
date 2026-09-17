<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix: grade_point was decimal(3,2) max 9.99; allow up to 999.99 so values like 100 are valid.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE grade_scales MODIFY grade_point DECIMAL(5,2) NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE grade_scales ALTER COLUMN grade_point TYPE NUMERIC(5,2)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE grade_scales MODIFY grade_point DECIMAL(3,2) NOT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE grade_scales ALTER COLUMN grade_point TYPE NUMERIC(3,2)');
        }
    }
};
