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
        Schema::create('late_fine_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->foreignId('class_section_group_id')->nullable()->constrained('class_section_groups')->cascadeOnDelete();
            $table->integer('days_from');
            $table->integer('days_to')->nullable();
            $table->enum('fine_type', ['fixed', 'per_day']);
            $table->decimal('amount', 10, 2);
            // Optional Maximum Cap
            $table->decimal('max_cap', 10, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['academic_session_id', 'class_section_group_id', 'days_from', 'days_to', 'fine_type', 'max_cap'], 'unique_late_fine_rule');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('late_fine_rules');
    }
};
