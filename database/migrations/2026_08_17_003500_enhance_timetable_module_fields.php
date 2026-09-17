<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('time_slots', function (Blueprint $table) {
            $table->string('slot_type', 20)->default('period')->after('is_break');
            $table->boolean('is_active')->default(true)->after('slot_type');
        });

        DB::table('time_slots')->where('is_break', true)->update(['slot_type' => 'break']);

        Schema::table('class_rooms', function (Blueprint $table) {
            $table->string('code', 50)->nullable()->after('name');
            $table->string('building', 100)->nullable()->after('code');
            $table->string('floor', 50)->nullable()->after('building');
            $table->string('room_type', 40)->default('classroom')->after('floor');
            $table->json('facilities')->nullable()->after('is_lab');
            $table->boolean('is_active')->default(true)->after('facilities');
        });

        DB::table('class_rooms')->where('is_lab', true)->update(['room_type' => 'laboratory']);

        Schema::table('timetables', function (Blueprint $table) {
            $table->string('status', 20)->default('draft')->after('is_active');
        });

        DB::table('timetables')->where('is_active', true)->update(['status' => 'published']);
        DB::table('timetables')->where('is_active', false)->update(['status' => 'archived']);

        // Room conflict uniqueness (MySQL allows multiple NULLs).
        Schema::table('timetable_enters', function (Blueprint $table) {
            $table->unique(['class_room_id', 'day', 'time_slot_id'], 'timetable_enters_room_day_slot_unique');
        });

        // Availability: room is not required; uniqueness per teacher/day/slot.
        Schema::table('teacher_availabilties', function (Blueprint $table) {
            $table->dropForeign(['class_room_id']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE teacher_availabilties MODIFY class_room_id BIGINT UNSIGNED NULL');
        }
        Schema::table('teacher_availabilties', function (Blueprint $table) {
            $table->foreign('class_room_id')->references('id')->on('class_rooms')->nullOnDelete();
            $table->unique(['teacher_id', 'day', 'time_slot_id'], 'teacher_avail_teacher_day_slot_unique');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_availabilties', function (Blueprint $table) {
            $table->dropUnique('teacher_avail_teacher_day_slot_unique');
        });

        Schema::table('timetable_enters', function (Blueprint $table) {
            $table->dropUnique('timetable_enters_room_day_slot_unique');
        });

        Schema::table('timetables', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('class_rooms', function (Blueprint $table) {
            $table->dropColumn(['code', 'building', 'floor', 'room_type', 'facilities', 'is_active']);
        });

        Schema::table('time_slots', function (Blueprint $table) {
            $table->dropColumn(['slot_type', 'is_active']);
        });
    }
};
