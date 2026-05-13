<?php

namespace App\Jobs;

use App\Models\Asset;
use App\Models\RetirementPlan;
use App\Models\RetirementSnapshot;
use App\Models\Tenant;
use App\Services\AssetBalanceService;
use App\Services\RetirementCalculatorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class TakeRetirementSnapshotJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 120;

    public function handle(AssetBalanceService $assetService, RetirementCalculatorService $calc): void
    {
        $today = Carbon::today();

        Tenant::all()->each(function (Tenant $tenant) use ($assetService, $calc, $today): void {
            tenancy()->initialize($tenant);

            $plan = RetirementPlan::first();
            if (! $plan) {
                tenancy()->end();
                return;
            }

            try {
                // Compute live portfolio
                $portfolioValue = (float) Asset::all()->sum(
                    fn (Asset $a) => $assetService->getCachedOrCompute($a)['balance']
                );

                $corpus  = $calc->computeRequiredCorpus($plan);
                $gap     = $calc->computeGapAnalysis($plan, $portfolioValue);
                $projAge = $calc->computeProjectedRetirementAge($plan, $portfolioValue);

                RetirementSnapshot::updateOrCreate(
                    ['tenant_id' => $tenant->id, 'snapshot_date' => $today],
                    [
                        'total_portfolio_value'    => $portfolioValue,
                        'required_corpus'          => $corpus['nominal'],
                        'gap'                      => $gap['gap_amount'],
                        'projected_retirement_age' => $projAge,
                        'on_track'                 => $gap['on_track'],
                    ]
                );
            } catch (\Throwable $e) {
                Log::error("[RetirementSnapshot] Tenant {$tenant->id}: " . $e->getMessage());
            }

            tenancy()->end();
        });
    }
}
