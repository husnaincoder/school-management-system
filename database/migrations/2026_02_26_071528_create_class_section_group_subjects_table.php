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
        Schema::create('class_section_group_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_section_group_id')->constrained('class_section_groups')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->integer('weekly_classes')->nullable();
            $table->timestamps();
            $table->unique(
                ['class_section_group_id','subject_id'],'csgs_group_subject_unique');
        
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_section_group_subjects');
    }
};
