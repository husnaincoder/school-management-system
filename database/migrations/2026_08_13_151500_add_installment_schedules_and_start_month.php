<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_installments', function (Blueprint $table) {
            $table->string('start_billing_month', 7)
                ->nullable()
                ->after('total_amount');
        });

        Schema::create('student_installment_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_installment_id')
                ->constrained('student_installments')
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_no');
            $table->decimal('amount', 12, 2);
            $table->string('billing_month', 7);
            $table->date('due_date')->nullable();
            $table->foreignId('invoice_id')
                ->nullable()
                ->constrained('invoices')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['student_installment_id', 'installment_no'], 'si_schedule_installment_unique');
            $table->unique(['student_installment_id', 'billing_month'], 'si_schedule_billing_month_unique');
            $table->index('billing_month');
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_installment_schedules');

        Schema::table('student_installments', function (Blueprint $table) {
            $table->dropColumn('start_billing_month');
        });
    }
};
