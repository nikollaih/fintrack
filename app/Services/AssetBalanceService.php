<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetBalanceCache;
use App\Models\AssetMovement;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AssetBalanceService
{
    /**
     * Compute the balance at a target date using EA compound interest + movements.
     * Returns ['balance' => float, 'interest_earned' => float, 'principal' => float]
     */
    public function computeAt(Asset $asset, Carbon $targetDate): array
    {
        $rateEA    = (float) ($asset->rate_ea ?? 0);
        $principal = (float) $asset->initial_balance;
        $startDate = Carbon::parse($asset->start_date)->startOfDay();
        $target    = $targetDate->copy()->startOfDay();

        // If target is before start, just return initial_balance
        if ($target->lt($startDate)) {
            return [
                'balance'         => $principal,
                'interest_earned' => 0.0,
                'principal'       => $principal,
            ];
        }

        // Load movements up to target date, sorted ascending
        $movements = AssetMovement::where('asset_id', $asset->id)
            ->whereDate('date', '<=', $target->toDateString())
            ->orderBy('date')
            ->get();

        $balance  = $principal;
        $lastDate = $startDate->copy();

        foreach ($movements as $movement) {
            $movDate = Carbon::parse($movement->date)->startOfDay();

            // Accrue interest from last event to this movement date
            $balance += $this->interestForPeriod($balance, $rateEA, $lastDate, $movDate);

            // Apply movement
            $balance += (float) $movement->amount;
            $lastDate = $movDate->copy();
        }

        // Accrue interest from last event to target date
        $balance += $this->interestForPeriod($balance, $rateEA, $lastDate, $target);

        $balance         = max(0, $balance);
        $interestEarned  = max(0, $balance - $principal - $movements->sum('amount'));

        return [
            'balance'         => round($balance, 4),
            'interest_earned' => round($interestEarned, 4),
            'principal'       => $principal,
        ];
    }

    /**
     * Get cached balance or compute it live and cache it.
     */
    public function getCachedOrCompute(Asset $asset): array
    {
        $cache = $asset->balanceCache;

        // Cache is valid if it was computed today
        if ($cache && Carbon::parse($cache->computed_at)->isToday()) {
            return [
                'balance'         => (float) $cache->balance,
                'interest_earned' => (float) $cache->interest_earned,
                'principal'       => (float) $asset->initial_balance,
            ];
        }

        $computed = $this->computeAt($asset, Carbon::today());
        $this->saveCache($asset, $computed);

        return $computed;
    }

    /**
     * Compute projection points for a single asset.
     * Returns array of ['date' => string, 'balance' => float, 'is_projection' => bool]
     */
    public function computeProjection(Asset $asset, Carbon $toDate, int $points = 60): array
    {
        $today     = Carbon::today();
        $startDate = Carbon::parse($asset->start_date)->startOfDay();

        // Build range: from start_date to toDate
        $rangeStart = $startDate->copy();
        $rangeEnd   = $toDate->copy()->startOfDay();

        if ($rangeEnd->lte($rangeStart)) {
            $rangeEnd = $rangeStart->copy()->addYear();
        }

        $totalDays  = max(1, $rangeStart->diffInDays($rangeEnd));
        $step       = max(1, (int) ceil($totalDays / $points));

        $result   = [];
        $current  = $rangeStart->copy();

        while ($current->lte($rangeEnd)) {
            $computed = $this->computeAt($asset, $current->copy());
            $result[] = [
                'date'          => $current->toDateString(),
                'balance'       => $computed['balance'],
                'is_projection' => $current->gt($today),
            ];
            $current->addDays($step);
        }

        // Always include today and toDate endpoints
        foreach ([$today, $rangeEnd] as $keyDate) {
            if ($keyDate->gte($rangeStart) && $keyDate->lte($rangeEnd)) {
                $computed = $this->computeAt($asset, $keyDate->copy());
                $result[] = [
                    'date'          => $keyDate->toDateString(),
                    'balance'       => $computed['balance'],
                    'is_projection' => $keyDate->gt($today),
                ];
            }
        }

        // Sort by date and remove duplicates
        usort($result, fn ($a, $b) => strcmp($a['date'], $b['date']));
        $seen   = [];
        $result = array_filter($result, function ($item) use (&$seen) {
            if (isset($seen[$item['date']])) {
                return false;
            }
            $seen[$item['date']] = true;
            return true;
        });

        return array_values($result);
    }

    /**
     * Portfolio projection: all assets combined.
     */
    public function portfolioProjection(Collection $assets, Carbon $toDate, int $points = 60): array
    {
        $today  = Carbon::today();
        $minStart = $assets->map(fn ($a) => Carbon::parse($a->start_date))->min() ?? $today->copy()->subYear();
        $rangeStart = $minStart->copy()->startOfDay();
        $rangeEnd   = $toDate->copy()->startOfDay();

        if ($rangeEnd->lte($rangeStart)) {
            $rangeEnd = $rangeStart->copy()->addYear();
        }

        $totalDays = max(1, $rangeStart->diffInDays($rangeEnd));
        $step      = max(1, (int) ceil($totalDays / $points));

        // Collect all key dates
        $dates = [];
        $current = $rangeStart->copy();
        while ($current->lte($rangeEnd)) {
            $dates[] = $current->toDateString();
            $current->addDays($step);
        }
        if (! in_array($today->toDateString(), $dates)) {
            $dates[] = $today->toDateString();
        }
        if (! in_array($rangeEnd->toDateString(), $dates)) {
            $dates[] = $rangeEnd->toDateString();
        }
        sort($dates);
        $dates = array_unique($dates);

        $chartData = [];
        foreach ($dates as $dateStr) {
            $dateCarbon = Carbon::parse($dateStr);
            $row = [
                'date'          => $dateStr,
                'total'         => 0,
                'is_projection' => $dateCarbon->gt($today),
            ];
            foreach ($assets as $asset) {
                $assetStart = Carbon::parse($asset->start_date)->startOfDay();
                if ($dateCarbon->lt($assetStart)) {
                    $row[$asset->id] = 0;
                } else {
                    $computed        = $this->computeAt($asset, $dateCarbon->copy());
                    $row[$asset->id] = $computed['balance'];
                    $row['total']   += $computed['balance'];
                }
            }
            $chartData[] = $row;
        }

        $assetsMeta = $assets->map(fn ($a) => [
            'id'   => $a->id,
            'name' => $a->name,
            'type' => $a->type,
        ])->values()->toArray();

        return [
            'chart_data' => $chartData,
            'assets'     => $assetsMeta,
        ];
    }

    /**
     * Build a timeline for the Show page.
     * Returns array of entries: {type, date, description, amount, balance}
     */
    public function buildTimeline(Asset $asset, Collection $movements, Carbon $today): array
    {
        $rateEA    = (float) ($asset->rate_ea ?? 0);
        $startDate = Carbon::parse($asset->start_date)->startOfDay();
        $principal = (float) $asset->initial_balance;

        $timeline  = [];
        $balance   = $principal;
        $lastDate  = $startDate->copy();

        // Start event
        $timeline[] = [
            'type'        => 'start',
            'date'        => $startDate->toDateString(),
            'description' => 'Inversión inicial',
            'amount'      => $principal,
            'balance'     => $principal,
        ];

        foreach ($movements->sortBy('date') as $movement) {
            $movDate = Carbon::parse($movement->date)->startOfDay();
            if ($movDate->lt($startDate)) {
                continue;
            }

            // Accrue interest
            $interest = $this->interestForPeriod($balance, $rateEA, $lastDate, $movDate);
            $balance += $interest;

            // Apply movement
            $amount   = (float) $movement->amount;
            $balance += $amount;
            $balance  = max(0, $balance);

            $timeline[] = [
                'type'        => 'movement',
                'date'        => $movDate->toDateString(),
                'description' => $movement->note ?? ($amount >= 0 ? 'Depósito' : 'Retiro'),
                'amount'      => $amount,
                'balance'     => round($balance, 4),
            ];

            $lastDate = $movDate->copy();
        }

        // Today entry
        if ($today->gte($startDate)) {
            $interest = $this->interestForPeriod($balance, $rateEA, $lastDate, $today);
            $balance += $interest;
            $balance  = max(0, $balance);

            $timeline[] = [
                'type'        => 'today',
                'date'        => $today->toDateString(),
                'description' => 'Saldo actual',
                'amount'      => null,
                'balance'     => round($balance, 4),
            ];
        }

        return $timeline;
    }

    /**
     * Refresh cache for one asset.
     */
    public function refreshCache(Asset $asset): void
    {
        $computed = $this->computeAt($asset, Carbon::today());
        $this->saveCache($asset, $computed);
    }

    /**
     * Refresh cache for all assets.
     */
    public function refreshAllCaches(): void
    {
        Asset::with('movements')->each(function (Asset $asset): void {
            $this->refreshCache($asset);
        });
    }

    /**
     * Interest accrued for a period using EA rate.
     * Returns the interest amount (not the new balance).
     */
    private function interestForPeriod(float $balance, float $rateEA, Carbon $from, Carbon $to): float
    {
        $days = max(0, (int) $from->diffInDays($to));
        if ($days === 0 || $rateEA === 0.0) {
            return 0.0;
        }
        return $balance * (pow(1 + $rateEA, $days / 365) - 1);
    }

    private function saveCache(Asset $asset, array $computed): void
    {
        AssetBalanceCache::updateOrCreate(
            ['asset_id' => $asset->id],
            [
                'tenant_id'       => $asset->tenant_id,
                'balance'         => $computed['balance'],
                'interest_earned' => $computed['interest_earned'],
                'computed_at'     => Carbon::now(),
            ]
        );
    }
}
