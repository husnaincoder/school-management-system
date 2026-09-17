<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->foreignId('created_by_employee_id')->nullable()->constrained('employees')->cascadeOnDelete();
            $table->foreignId('created_by_teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->boolean('is_pinned')->default(false);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->boolean('allow_comments')->default(true);
            $table->boolean('allow_likes')->default(true);
            $table->boolean('is_published')->default(true);
            $table->timestamp('publish_at')->nullable();
            $table->timestamp('expire_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};
