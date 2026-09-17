<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('income_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('student_id')->nullable()->constrained()->onDelete('set null');
            $table->string('type'); // income or expense
            $table->string('category'); // income: student_fee, admission_fee, exam_fee, transport_fee, other_income
                                           // expense: teacher_salary, employee_salary, utility_bills, maintenance, stationery, other_expense
            $table->decimal('amount', 10, 2);
            $table->date('date');
            $table->text('description')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('attachment')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('income_expenses');
    }
};
