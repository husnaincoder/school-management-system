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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Physics, Chemistry, History
            $table->string('code')->nullable();
            $table->string('type')->nullable(); // Theory / Practical
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['name', 'code', 'type'], 'subject_name_code_type_uq');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
