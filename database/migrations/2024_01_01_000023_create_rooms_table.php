<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hostel_id')->constrained()->onDelete('cascade');
            $table->string('room_number');
            $table->string('floor')->nullable();
            $table->integer('capacity');
            $table->integer('occupied_beds')->default(0);
            $table->decimal('fee_per_bed', 10, 2)->default(0);
            $table->text('description')->nullable();
            $table->enum('status', ['available', 'full', 'maintenance'])->default('available');
            $table->timestamps();

            $table->unique(['hostel_id', 'room_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
