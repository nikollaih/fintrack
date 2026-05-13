<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retirement_plans', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('current_age');
            $table->unsignedTinyInteger('target_retirement_age');
            $table->decimal('expected_monthly_expense_at_retirement', 15, 4);
            $table->unsignedTinyInteger('life_expectancy')->default(85);
            $table->decimal('expected_annual_inflation_rate', 6, 4)->default(0.06);
            $table->decimal('expected_portfolio_return_rate', 6, 4)->default(0.10);
            $table->decimal('expected_retirement_return_rate', 6, 4)->default(0.07);
            $table->decimal('monthly_contribution', 15, 4)->default(0);
            $table->boolean('include_agro_income')->default(false);
            $table->decimal('agro_monthly_equivalent', 15, 4)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('tenant_id'); // one plan per tenant
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retirement_plans');
    }
};
