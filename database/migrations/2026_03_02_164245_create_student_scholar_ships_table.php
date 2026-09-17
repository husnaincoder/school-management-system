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
        Schema::create('student_scholar_ships', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('scholarship_id')->constrained('scholar_ships')->cascadeOnDelete();
            $table->timestamps();

            // Custom shorter unique index name to avoid MySQL 64-char identifier limit
            $table->unique(
                ['student_enrollment_id', 'scholarship_id'],
                'stud_sch_enrollment_scholar_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_scholar_ships');
    }
};
