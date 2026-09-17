<?php

use App\Services\Setting\EnvMailWriter;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Move leftover email.password out of system_settings into .env, then delete the DB secret.
     */
    public function up(): void
    {
        $row = DB::table('system_settings')->where('key', 'email.password')->first();

        if ($row && filled($row->value)) {
            try {
                (new EnvMailWriter())->updateMailConfig([
                    'password' => $row->value,
                ]);
            } catch (\Throwable) {
                // Still remove plaintext from DB even if .env write fails.
            }
        }

        DB::table('system_settings')->where('key', 'email.password')->delete();
    }

    public function down(): void
    {
        // Irreversible: secrets are not restored into system_settings.
    }
};
