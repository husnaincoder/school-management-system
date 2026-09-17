<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_subjects', function (Blueprint $table) {
            $table->date('exam_date')->nullable()->after('sort_order');
            $table->time('start_time')->nullable()->after('exam_date');
            $table->time('end_time')->nullable()->after('start_time');
            $table->string('room', 100)->nullable()->after('end_time');
            $table->foreignId('invigilator_teacher_id')
                ->nullable()
                ->after('room')
                ->constrained('teachers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('exam_subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invigilator_teacher_id');
            $table->dropColumn(['exam_date', 'start_time', 'end_time', 'room']);
        });
    }
};
