<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds grade_point column if missing (e.g. table was created before column was added to create migration).
     */
    public function up(): void
    {
        if (Schema::hasTable('student_exam_results') && ! Schema::hasColumn('student_exam_results', 'grade_point')) {
            Schema::table('student_exam_results', function (Blueprint $table) {
                $table->decimal('grade_point', 5, 2)->nullable()->after('grade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('student_exam_results') && Schema::hasColumn('student_exam_results', 'grade_point')) {
            Schema::table('student_exam_results', function (Blueprint $table) {
                $table->dropColumn('grade_point');
            });
        }
    }
};
