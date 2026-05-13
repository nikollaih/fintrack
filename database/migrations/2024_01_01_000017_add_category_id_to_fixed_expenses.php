<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE fixed_expenses ALTER COLUMN category DROP NOT NULL');

        Schema::table('fixed_expenses', function (Blueprint $table): void {
            $table->foreignUuid('category_id')->nullable()->after('amount')
                ->constrained('categories')->nullOnDelete();
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::table('fixed_expenses', function (Blueprint $table): void {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
        DB::statement("ALTER TABLE fixed_expenses ALTER COLUMN category SET NOT NULL");
    }
};
