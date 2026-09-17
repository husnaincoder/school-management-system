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
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Sick Leave, Casual Leave
            $table->boolean('is_paid')->default(true);
            $table->integer('max_days')->nullable();
            $table->boolean('for_students')->default(true);
            $table->boolean('for_teachers')->default(true);
            $table->boolean('for_employees')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};
