<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->index('issue_date');
            $table->index('due_date');
            $table->index('status');
            $table->index('class_section_group_id');
            $table->index('student_enrollment_id');
            $table->index('billing_month');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('payment_date');
            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['issue_date']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['status']);
            $table->dropIndex(['class_section_group_id']);
            $table->dropIndex(['student_enrollment_id']);
            $table->dropIndex(['billing_month']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payment_date']);
            $table->dropIndex(['invoice_id']);
        });
    }
};
