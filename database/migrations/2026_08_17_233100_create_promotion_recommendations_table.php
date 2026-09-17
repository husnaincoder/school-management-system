<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('recommended_by')->constrained('users')->cascadeOnDelete();
            $table->enum('recommendation', ['promote', 'retain', 'conditional'])->default('promote');
            $table->text('remarks')->nullable();
            $table->string('status')->default('pending'); // pending|accepted|rejected
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_recommendations');
    }
};
