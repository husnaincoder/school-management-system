<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_monthly_freezes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->unsignedTinyInteger('month'); // 1-12
            $table->unsignedSmallInteger('year');
            $table->string('type', 20)->default('student'); // student, teacher, employee
            $table->boolean('is_frozen')->default(true);
            $table->foreignId('frozen_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('frozen_at')->nullable();
            $table->timestamps();
            $table->unique(['academic_session_id', 'year', 'month', 'type'], 'attendance_freeze_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_monthly_freezes');
    }
};
