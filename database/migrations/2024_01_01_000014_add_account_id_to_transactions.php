<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make payment_method nullable (existing records keep their value)
        DB::statement('ALTER TABLE transactions ALTER COLUMN payment_method DROP NOT NULL');

        Schema::table('transactions', function (Blueprint $table): void {
            $table->foreignUuid('account_id')->nullable()->after('tenant_id')
                ->constrained('accounts')->nullOnDelete();
            $table->index('account_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table): void {
            $table->dropForeign(['account_id']);
            $table->dropColumn('account_id');
        });
        DB::statement("ALTER TABLE transactions ALTER COLUMN payment_method SET NOT NULL");
    }
};
