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
        Schema::create('leaves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();    
            $table->foreignId('student_enrollment_id')->nullable()->constrained('student_enrollments')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();   
            $table->foreignId('employee_id')->nullable()->constrained('employees')->cascadeOnDelete();      
            $table->date('start_date');      
            $table->date('end_date');    
            $table->integer('total_days')->default(1);
            $table->text('reason')->nullable();
            $table->enum('status',[
                'pending',
                'approved',
                'rejected',
                'cancelled'
            ])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
