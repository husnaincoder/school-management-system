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
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('from_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('to_class_section_group_id')->constrained('class_section_groups')->cascadeOnDelete();
            $table->foreignId('promoted_by')->constrained('users')->cascadeOnDelete();
            $table->date('promotion_date')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
