<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('carried_forward_amount', 12, 2)->default(0)->after('paid_amount');
            $table->foreignId('carried_forward_to_invoice_id')
                ->nullable()
                ->after('carried_forward_amount')
                ->constrained('invoices')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('carried_forward_to_invoice_id');
            $table->dropColumn('carried_forward_amount');
        });
    }
};
