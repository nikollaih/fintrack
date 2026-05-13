<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Rename balance -> initial_balance
        DB::statement('ALTER TABLE assets RENAME COLUMN balance TO initial_balance');

        // Add start_date (nullable first, then fill, then set not null)
        Schema::table('assets', function (Blueprint $table): void {
            $table->date('start_date')->nullable()->after('initial_balance');
            $table->enum('compounding_frequency', ['daily', 'monthly', 'at_maturity'])
                ->default('daily')
                ->after('start_date');
        });

        DB::statement('UPDATE assets SET start_date = CURRENT_DATE WHERE start_date IS NULL');

        DB::statement('ALTER TABLE assets ALTER COLUMN start_date SET NOT NULL');

        // Change rate_ea precision
        DB::statement('ALTER TABLE assets ALTER COLUMN rate_ea TYPE DECIMAL(10,6)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE assets RENAME COLUMN initial_balance TO balance');

        Schema::table('assets', function (Blueprint $table): void {
            $table->dropColumn(['start_date', 'compounding_frequency']);
        });

        DB::statement('ALTER TABLE assets ALTER COLUMN rate_ea TYPE DECIMAL(6,4)');
    }
};
