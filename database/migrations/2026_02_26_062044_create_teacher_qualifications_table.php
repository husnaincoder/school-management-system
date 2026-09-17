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
        Schema::create('teacher_qualifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('degree_name')->nullable(); // Matric, Inter, BSc, MSc, MPhil, PhD
            $table->string('field_of_study')->nullable();// Physics, Chemistry etc
            $table->string('board_university')->nullable();
            $table->year('passing_year')->nullable();
            $table->string('grade_division')->nullable();// A+, 1st Division, CGPA 3.5
            $table->string('certificate_image')->nullable();// A+, image, pdf , etc
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_qualifications');
    }
};
