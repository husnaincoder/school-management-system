<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('id_card_number');
            $table->boolean('is_active')->default(true)->after('phone');
            $table->string('profile_photo')->nullable()->after('is_active');
            $table->timestamp('last_login_at')->nullable()->after('profile_photo');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'is_active', 'profile_photo', 'last_login_at']);
        });
    }
};
