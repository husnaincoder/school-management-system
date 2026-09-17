<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notice_taget_details', function (Blueprint $table) {
            $table->string('department')->nullable()->after('parent_id');
        });
    }

    public function down(): void
    {
        Schema::table('notice_taget_details', function (Blueprint $table) {
            $table->dropColumn('department');
        });
    }
};
