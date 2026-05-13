<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liability_simulations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');

            $table->uuid('liability_id');
            $table->foreign('liability_id')->references('id')->on('liabilities')->cascadeOnDelete();

            $table->string('name');
            $table->decimal('extra_monthly_payment', 15, 4)->default(0);
            $table->decimal('lump_sum_amount', 15, 4)->nullable();
            $table->date('lump_sum_date')->nullable();

            $table->date('resulting_payoff_date');
            $table->decimal('resulting_total_interest', 15, 4);
            $table->integer('resulting_months_saved');

            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'liability_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liability_simulations');
    }
};
