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
        Schema::create('student_exam_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_subject_id')->constrained('exam_subjects')->cascadeOnDelete();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('obtained_marks', 5, 2)->nullable();
            $table->enum('attendance_status', ['present','absent','leave'])->default('present');
            $table->string('absent_reason')->nullable();
            $table->timestamps();
            $table->unique(['exam_subject_id', 'student_enrollment_id'], 'unique_student_exam_record_per_subject');
            $table->index(['exam_subject_id'], 'student_exam_records_exam_subject_id_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_exam_records');
    }
};
