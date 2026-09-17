<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_remarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('class_section_group_id')->nullable()->constrained('class_section_groups')->nullOnDelete();
            $table->string('type', 50)->default('remark'); // remark, warning, behavior, parent_meeting
            $table->text('body');
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->date('remark_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_remarks');
    }
};
