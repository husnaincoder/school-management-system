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
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete(); 
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();  
            $table->foreignId('employee_id')->nullable()->constrained('employees')->cascadeOnDelete();
            $table->integer('total_days');  
            $table->integer('used_days')->default(0);     
            $table->integer('remaining_days')->default(0);    
            $table->year('year');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
