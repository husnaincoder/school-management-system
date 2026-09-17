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
        Schema::create('notice_targets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('notice_id')
                ->constrained('notices')
                ->cascadeOnDelete();

            $table->enum('target_type', [
                'All Students Enrolled in a Class',
                'All Teachers Teaching a Class',
                'All Parents of a Student enrolled in a Class',
                'All Employees Working in a Department',
                'teacher Teaching a Class',
                'employee of a Department',
                'parent of a Student',
                'Specific teacher',
                'Specific employee',
                'Specific parent',
                'Specific student'
            ]);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notice_targets');
    }
};
