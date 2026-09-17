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
        Schema::create('grade_scales', function (Blueprint $table) {
            $table->id();
            $table->string('grade'); // A+, A, B
            $table->decimal('min_percentage', 5,2);
            $table->decimal('max_percentage', 5,2);
            $table->decimal('grade_point', 5, 2); // e.g. 0–100 or 4.00 GPA style
            $table->boolean('is_fail_grade')->default(false);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['grade'], 'unique_grade_scale_grade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_scales');
    }
};
