<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('timetable_adjustments', function (Blueprint $table) {
            $table->foreignId('merged_into_timetable_entry_id')
                ->nullable()
                ->after('substitute_teacher_id')
                ->constrained('timetable_enters')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable_adjustments', function (Blueprint $table) {
            $table->dropForeign(['merged_into_timetable_entry_id']);
        });
    }
};
