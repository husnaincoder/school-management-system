<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('spouse_name')->nullable(); // father/mother/guardian name
            $table->string('relation_with_student')->default('Father'); // Father/Mother/Guardian
            $table->string('father_cnic', 15)->nullable();
            $table->string('spouse_cnic', 15)->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->string('occupation')->nullable();
            $table->decimal('monthly_income', 10, 2)->nullable(); // new field
            $table->string('photo')->nullable();
        
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parents');
    }
};
