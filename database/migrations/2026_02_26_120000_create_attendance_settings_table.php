<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
            $table->string('user_type', 20); // student, teacher, employee
            $table->time('late_after')->nullable();
            $table->time('half_day_after')->nullable();
            $table->boolean('weekend_off')->default(false);
            $table->timestamps();
            $table->unique(['academic_session_id', 'user_type'], 'attendance_settings_session_type_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_settings');
    }
};
