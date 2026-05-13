<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liabilities', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');

            $table->string('name');
            $table->enum('type', ['mortgage', 'personal_loan', 'vehicle_loan', 'credit_card_loan', 'cooperative_loan', 'other']);
            $table->enum('status', ['active', 'paid_off', 'refinanced'])->default('active');

            $table->decimal('original_amount', 15, 4);
            $table->decimal('outstanding_balance', 15, 4);
            $table->decimal('annual_interest_rate', 8, 4);
            $table->integer('term_months');

            $table->date('start_date');
            $table->date('first_payment_date');
            $table->decimal('monthly_payment', 15, 4);
            $table->unsignedTinyInteger('payment_day');

            $table->uuid('linked_account_id')->nullable();
            $table->foreign('linked_account_id')->references('id')->on('accounts')->nullOnDelete();

            $table->decimal('early_payment_penalty_rate', 6, 4)->nullable();
            $table->text('notes')->nullable();

            // Mortgage-specific optional fields
            $table->decimal('estimated_property_value', 15, 4)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liabilities');
    }
};
