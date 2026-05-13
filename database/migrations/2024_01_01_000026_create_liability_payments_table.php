<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('liability_payments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('tenant_id');

            $table->uuid('liability_id');
            $table->foreign('liability_id')->references('id')->on('liabilities')->cascadeOnDelete();

            $table->date('payment_date');
            $table->decimal('total_paid', 15, 4);
            $table->decimal('principal_paid', 15, 4);
            $table->decimal('interest_paid', 15, 4);
            $table->decimal('outstanding_balance_after', 15, 4);

            $table->uuid('transaction_id')->nullable();
            $table->foreign('transaction_id')->references('id')->on('transactions')->nullOnDelete();

            $table->enum('payment_type', ['scheduled', 'extra_payment', 'lump_sum_payment'])->default('scheduled');
            $table->integer('payment_number')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'liability_id']);
            $table->index(['liability_id', 'payment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('liability_payments');
    }
};
