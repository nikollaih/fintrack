<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make the legacy text column nullable
        DB::statement('ALTER TABLE transactions ALTER COLUMN category DROP NOT NULL');

        Schema::table('transactions', function (Blueprint $table): void {
            $table->foreignUuid('category_id')->nullable()->after('account_id')
                ->constrained('categories')->nullOnDelete();
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
        DB::statement("ALTER TABLE transactions ALTER COLUMN category SET NOT NULL");
    }
};
