<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Change target_type from ENUM to string to avoid "Data truncated" when
     * values are sent from the app (e.g. "Specific teacher") and ENUM doesn't match.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE notice_targets MODIFY target_type VARCHAR(80) NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE notice_targets MODIFY target_type ENUM(
                'All Students Enrolled in a Class',
                'All Teachers Teaching a Class',
                'All Parents of a Student enrolled in a Class',
                'All Employees Working in a Department',
                'teacher Teaching a Class',
                'employee of a Department',
                'parent of a Student',
                'Specific teacher',
                'Specific employee',
                'Specific parent',
                'Specific student'
            ) NOT NULL");
        }
    }
};
