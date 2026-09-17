<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->string('status', 20)->default('generated')->after('net_salary');
            $table->unsignedTinyInteger('working_days')->default(0)->after('status');
            $table->unsignedTinyInteger('present_days')->default(0)->after('working_days');
            $table->unsignedTinyInteger('absent_days')->default(0)->after('present_days');
            $table->unsignedTinyInteger('late_days')->default(0)->after('absent_days');
            $table->unsignedTinyInteger('leave_days')->default(0)->after('late_days');
            $table->unsignedTinyInteger('paid_leave_days')->default(0)->after('leave_days');
            $table->unsignedTinyInteger('unpaid_leave_days')->default(0)->after('paid_leave_days');
            $table->decimal('overtime_hours', 8, 2)->default(0)->after('unpaid_leave_days');
            $table->decimal('leave_deduction_amount', 10, 2)->default(0)->after('overtime_hours');
            $table->index('status');
        });

        // Existing rows: paid if payment_date set, else generated.
        DB::table('payrolls')->whereNotNull('payment_date')->update(['status' => 'paid']);
        DB::table('payrolls')->whereNull('payment_date')->update(['status' => 'generated']);

        Schema::table('attendance_based_deductions', function (Blueprint $table) {
            $table->unsignedTinyInteger('working_days')->default(0)->after('teacher_id');
            $table->unsignedTinyInteger('present_days')->default(0)->after('working_days');
            $table->unsignedTinyInteger('leave_days')->default(0)->after('late_days');
            $table->unsignedTinyInteger('paid_leave_days')->default(0)->after('leave_days');
            $table->decimal('overtime_hours', 8, 2)->default(0)->after('leave_without_pay_days');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_based_deductions', function (Blueprint $table) {
            $table->dropColumn([
                'working_days',
                'present_days',
                'leave_days',
                'paid_leave_days',
                'overtime_hours',
            ]);
        });

        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn([
                'status',
                'working_days',
                'present_days',
                'absent_days',
                'late_days',
                'leave_days',
                'paid_leave_days',
                'unpaid_leave_days',
                'overtime_hours',
                'leave_deduction_amount',
            ]);
        });
    }
};
