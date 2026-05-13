<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retirement_snapshots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->cascadeOnDelete();
            $table->date('snapshot_date');
            $table->decimal('total_portfolio_value', 15, 4);
            $table->decimal('required_corpus', 15, 4);
            $table->decimal('gap', 15, 4);
            $table->unsignedTinyInteger('projected_retirement_age');
            $table->boolean('on_track');
            $table->timestamps();

            $table->unique(['tenant_id', 'snapshot_date']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retirement_snapshots');
    }
};
