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
        Schema::create('salary_advances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->date('request_date');
            $table->date('approved_date')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'recovered'])->default('pending');
            $table->foreignId('recovery_payroll_id')->nullable()->constrained('payrolls')->nullOnDelete();
            $table->decimal('recovered_amount', 10, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_advances');
    }
};
