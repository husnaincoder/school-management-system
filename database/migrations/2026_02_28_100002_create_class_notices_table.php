<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_section_group_id')->constrained('class_section_groups')->cascadeOnDelete();
            $table->string('title');
            $table->text('body')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('notify_parents')->default(false);
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_notices');
    }
};
