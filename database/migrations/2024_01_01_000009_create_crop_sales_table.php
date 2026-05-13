<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crop_sales', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('cycle_id')->constrained('crop_cycles')->cascadeOnDelete();
            $table->foreignUuid('buyer_id')->nullable()->constrained('buyers')->nullOnDelete();
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->decimal('unit_price', 15, 4);
            $table->date('sale_date');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'cycle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crop_sales');
    }
};
