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
        Schema::create('student_exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('grade_scale_id')->nullable()->constrained('grade_scales')->nullOnDelete();
            $table->string('grade', 10)->nullable(); // snapshot for history if grade_scale deleted
            $table->decimal('grade_point', 5, 2)->nullable(); // snapshot for reports
            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_marks', 8,2);
            $table->decimal('obtained_marks', 8,2);
            $table->decimal('percentage', 5,2);
            $table->integer('position')->nullable();
            $table->boolean('is_passed')->default(true);
            $table->timestamps();
            $table->unique(['exam_id', 'student_enrollment_id'], 'unique_student_exam_result_per_exam');
            $table->index(['exam_id'], 'student_exam_results_exam_id_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_exam_results');
    }
};
