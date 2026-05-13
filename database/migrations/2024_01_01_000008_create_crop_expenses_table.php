<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_expenses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('cycle_id')->constrained('crop_cycles')->cascadeOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->enum('phase', ['preparation', 'sowing', 'maintenance', 'harvest']);
            $table->string('category');
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 4);
            $table->date('expense_date');
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'cycle_id']);
            $table->index(['tenant_id', 'phase']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_expenses');
    }
};
