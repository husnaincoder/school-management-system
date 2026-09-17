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
        Schema::create('leave_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leave_id')->constrained()->cascadeOnDelete();  
            $table->foreignId('approved_by')->constrained('users')->cascadeOnDelete();
            $table->enum('status',[
                'approved',
                'rejected'
            ]);   
            $table->text('note')->nullable();       
            $table->timestamp('approved_at')->nullable();      
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_approvals');
    }
};
