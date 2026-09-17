<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('description')->constrained('notice_categories')->nullOnDelete();
        });

        $this->addUserIdWithUnique('notice_reads');
        $this->addUserIdWithUnique('notice_likes');
        $this->addUserIdComments('notice_comments');
        $this->addUserIdWithUnique('notice_notifications');
    }

    private function addUserIdWithUnique(string $tableName): void
    {
        $shortNames = ['notice_reads' => 'nr_notice_actor_unique', 'notice_likes' => 'nl_notice_actor_unique', 'notice_notifications' => 'nn_notice_actor_unique'];
        // Drop all FKs so the composite unique (used by notice_id FK) can be dropped
        Schema::table($tableName, function (Blueprint $table) {
            $table->dropForeign(['notice_id']);
            $table->dropForeign(['employee_id']);
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['class_section_group_id']);
            $table->dropForeign(['student_enrollment_id']);
        });
        Schema::table($tableName, function (Blueprint $table) use ($tableName, $shortNames) {
            $table->dropUnique($shortNames[$tableName] ?? ['notice_id', 'employee_id', 'teacher_id', 'parent_id', 'student_enrollment_id']);
        });
        Schema::table($tableName, function (Blueprint $table) use ($tableName) {
            $table->foreignId('user_id')->nullable()->after('notice_id')->constrained('users')->cascadeOnDelete();
            $table->unique(['notice_id', 'user_id'], $tableName === 'notice_reads' ? 'nr_notice_user_unique' : ($tableName === 'notice_likes' ? 'nl_notice_user_unique' : 'nn_notice_user_unique'));
        });
        // Re-add FKs
        Schema::table($tableName, function (Blueprint $table) {
            $table->foreign('notice_id')->references('id')->on('notices')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->foreign('parent_id')->references('id')->on('parents')->cascadeOnDelete();
            $table->foreign('class_section_group_id')->references('id')->on('class_section_groups')->cascadeOnDelete();
            $table->foreign('student_enrollment_id')->references('id')->on('student_enrollments')->cascadeOnDelete();
        });
    }

    private function addUserIdComments(string $tableName): void
    {
        Schema::table($tableName, function (Blueprint $table) {
            $table->dropForeign(['notice_id']);
            $table->dropForeign(['employee_id']);
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['class_section_group_id']);
            $table->dropForeign(['student_enrollment_id']);
        });
        Schema::table($tableName, function (Blueprint $table) {
            $table->dropUnique('nc_notice_actor_unique');
        });
        Schema::table($tableName, function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('notice_id')->constrained('users')->cascadeOnDelete();
        });
        Schema::table($tableName, function (Blueprint $table) {
            $table->foreign('notice_id')->references('id')->on('notices')->cascadeOnDelete();
            $table->foreign('employee_id')->references('id')->on('employees')->cascadeOnDelete();
            $table->foreign('teacher_id')->references('id')->on('teachers')->cascadeOnDelete();
            $table->foreign('parent_id')->references('id')->on('parents')->cascadeOnDelete();
            $table->foreign('class_section_group_id')->references('id')->on('class_section_groups')->cascadeOnDelete();
            $table->foreign('student_enrollment_id')->references('id')->on('student_enrollments')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notices', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        $this->removeUserIdWithUnique('notice_reads');
        $this->removeUserIdWithUnique('notice_likes');
        $this->removeUserIdComments('notice_comments');
        $this->removeUserIdWithUnique('notice_notifications');
    }

    private function removeUserIdWithUnique(string $tableName): void
    {
        $shortNames = ['notice_reads' => 'nr_notice_actor_unique', 'notice_likes' => 'nl_notice_actor_unique', 'notice_notifications' => 'nn_notice_actor_unique'];
        $userUniqueNames = ['notice_reads' => 'nr_notice_user_unique', 'notice_likes' => 'nl_notice_user_unique', 'notice_notifications' => 'nn_notice_user_unique'];
        Schema::table($tableName, function (Blueprint $table) use ($tableName, $userUniqueNames) {
            $table->dropUnique($userUniqueNames[$tableName] ?? ['notice_id', 'user_id']);
            $table->dropForeign(['user_id']);
        });
        Schema::table($tableName, function (Blueprint $table) use ($tableName, $shortNames) {
            $table->unique(['notice_id', 'employee_id', 'teacher_id', 'parent_id', 'student_enrollment_id'], $shortNames[$tableName]);
        });
    }

    private function removeUserIdComments(string $tableName): void
    {
        Schema::table($tableName, function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table($tableName, function (Blueprint $table) {
            $table->unique(['notice_id', 'employee_id', 'teacher_id', 'parent_id', 'student_enrollment_id'], 'nc_notice_actor_unique');
        });
    }
};
