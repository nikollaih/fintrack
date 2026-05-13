<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Refresh asset balance caches every day at 01:00
Schedule::call(fn () => app(\App\Services\AssetBalanceService::class)->refreshAllCaches())
    ->daily()
    ->at('01:00');

// Auto-generate monthly reports for all tenants on the 1st of each month at 02:00
Schedule::call(function () {
    $prevMonth = \Illuminate\Support\Carbon::now()->subMonth();

    \App\Models\Tenant::all()->each(function ($tenant) use ($prevMonth): void {
        tenancy()->initialize($tenant);

        $report = \App\Models\Report::firstOrCreate(
            ['year' => $prevMonth->year, 'month' => $prevMonth->month],
            ['status' => 'pending']
        );

        if ($report->status !== 'completed') {
            try {
                app(\App\Services\ReportGeneratorService::class)->generate($report->fresh());
            } catch (\Throwable) {
                // Individual failure should not block other tenants
            }
        }

        tenancy()->end();
    });
})->monthlyOn(1, '02:00');

// Retirement snapshots on the 1st of each month at 02:30
Schedule::job(new \App\Jobs\TakeRetirementSnapshotJob)->monthlyOn(1, '02:30');
