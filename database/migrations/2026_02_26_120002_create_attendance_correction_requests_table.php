<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_correction_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->string('attendance_type', 20); // student, teacher, employee
            $table->unsignedBigInteger('attendance_record_id'); // student_attendance_id, etc.
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->string('reason', 500);
            $table->json('requested_changes')->nullable(); // e.g. {"status":"present"}
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_remarks')->nullable();
            $table->timestamps();
            $table->index(['attendance_session_id', 'status'], 'acr_session_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_correction_requests');
    }
};
