<?php

namespace App\Http\Controllers;

use App\Http\Requests\RetirementPlanner\SaveRetirementPlanRequest;
use App\Models\Asset;
use App\Models\Liability;
use App\Models\RetirementPlan;
use App\Models\RetirementSnapshot;
use App\Services\AssetBalanceService;
use App\Services\RetirementCalculatorService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RetirementPlannerController extends Controller
{
    public function __construct(
        private readonly AssetBalanceService $assetService,
        private readonly RetirementCalculatorService $calc
    ) {}

    public function index(): Response
    {
        $plan      = RetirementPlan::first();
        $assets    = Asset::all();

        // Build live portfolio from all assets
        $assetBreakdown = [];
        $portfolioTotal = 0.0;

        foreach ($assets as $asset) {
            $result          = $this->assetService->getCachedOrCompute($asset);
            $balance         = $result['balance'];
            $portfolioTotal += $balance;
            $assetBreakdown[] = [
                'id'      => $asset->id,
                'name'    => $asset->name,
                'type'    => $asset->type,
                'rate_ea' => $asset->rate_ea ? (float) $asset->rate_ea : null,
                'balance' => $balance,
            ];
        }

        $portfolio = ['total' => $portfolioTotal, 'assets' => $assetBreakdown];

        $calculations = null;
        if ($plan) {
            $corpus    = $this->calc->computeRequiredCorpus($plan);
            $gap       = $this->calc->computeGapAnalysis($plan, $portfolioTotal);
            $projAge   = $this->calc->computeProjectedRetirementAge($plan, $portfolioTotal);
            $reqContrib = $this->calc->computeRequiredMonthlyContribution($plan, $portfolioTotal);
            $retRate   = (float) $plan->expected_retirement_return_rate;

            $projCorpus = $gap['projected_corpus'];
            $scenarios  = [
                'conservative' => $this->calc->computeScenario($plan, $portfolioTotal, 0.07),
                'moderate'     => $this->calc->computeScenario($plan, $portfolioTotal, 0.10),
                'optimistic'   => $this->calc->computeScenario($plan, $portfolioTotal, 0.13),
            ];

            $assetProjections = $this->calc->computeAssetProjections(
                $plan, $assetBreakdown, $corpus['nominal']
            );

            $chartData = $this->calc->computeProjectionChart($plan, $portfolioTotal);

            $agroImpact = null;
            if ($plan->include_agro_income && $plan->agro_monthly_equivalent > 0) {
                $agroContrib = $plan->total_monthly_contribution;
                $baseContrib = (float) $plan->monthly_contribution;
                $agroAgeWith    = $this->calc->computeProjectedRetirementAge($plan, $portfolioTotal, $agroContrib);
                $agroAgeWithout = $this->calc->computeProjectedRetirementAge($plan, $portfolioTotal, $baseContrib);
                $agroGap        = $this->calc->computeGapAnalysis($plan, $portfolioTotal, $agroContrib);

                $agroImpact = [
                    'improved_retirement_age'  => $agroAgeWith,
                    'without_retirement_age'   => $agroAgeWithout,
                    'years_earlier'            => max(0, $agroAgeWithout - $agroAgeWith),
                    'improved_corpus'          => $agroGap['projected_corpus'],
                    'agro_monthly_equivalent'  => (float) $plan->agro_monthly_equivalent,
                ];
            }

            $calculations = [
                'required_corpus'              => $corpus['nominal'],
                'required_corpus_real'         => $corpus['real'],
                'monthly_expense_at_retirement'=> $corpus['monthly_expense_at_retirement'],
                'projected_corpus'             => $projCorpus,
                'gap_amount'                   => $gap['gap_amount'],
                'gap_pct'                      => $gap['gap_pct'],
                'on_track'                     => $gap['on_track'],
                'projected_retirement_age'     => $projAge,
                'required_monthly_contribution'=> $reqContrib,
                'monthly_passive_income_perp'  => round($this->calc->computeMonthlyPassiveIncome($projCorpus, $retRate, 0), 2),
                'monthly_passive_income_25y'   => round($this->calc->computeMonthlyPassiveIncome($projCorpus, $retRate, 25), 2),
                'monthly_passive_income_30y'   => round($this->calc->computeMonthlyPassiveIncome($projCorpus, $retRate, 30), 2),
                'scenarios'                    => $scenarios,
                'chart_data'                   => $chartData,
                'asset_projections'            => $assetProjections,
                'agro_impact'                  => $agroImpact,
                'action_plan'                  => $this->calc->generateActionPlan($plan, $portfolioTotal, $gap),
            ];
        }

        $snapshots = RetirementSnapshot::orderBy('snapshot_date')
            ->get()
            ->map(fn ($s) => [
                'snapshot_date'           => $s->snapshot_date->toDateString(),
                'total_portfolio_value'   => (float) $s->total_portfolio_value,
                'required_corpus'         => (float) $s->required_corpus,
                'gap'                     => (float) $s->gap,
                'projected_retirement_age'=> $s->projected_retirement_age,
                'on_track'                => $s->on_track,
            ])
            ->toArray();

        // Debt impact on retirement contributions
        $activeLiabilities  = Liability::where('status', 'active')->get();
        $debtMonthlyCommit  = (float) $activeLiabilities->sum('monthly_payment');
        $debtFreeDate       = null;
        if ($activeLiabilities->isNotEmpty()) {
            $latestPayoff = $activeLiabilities->map(function ($l) {
                $payments = $l->first_payment_date->copy();
                return $payments->addMonths(max(0, $l->term_months - $l->payments()->count()));
            })->max();
            $debtFreeDate = $latestPayoff?->toDateString();
        }

        return Inertia::render('RetirementPlanner/Index', [
            'plan'                  => $plan ? $this->planToArray($plan) : null,
            'portfolio'             => $portfolio,
            'calculations'          => $calculations,
            'snapshots'             => $snapshots,
            'debt_monthly_commitment' => $debtMonthlyCommit,
            'debt_free_date'          => $debtFreeDate,
        ]);
    }

    public function save(SaveRetirementPlanRequest $request): RedirectResponse
    {
        RetirementPlan::updateOrCreate(
            ['tenant_id' => tenancy()->tenant->id],
            $request->validated()
        );

        return back()->with('success', 'Plan de retiro guardado y proyecciones actualizadas.');
    }

    private function planToArray(RetirementPlan $plan): array
    {
        return [
            'id'                                     => $plan->id,
            'current_age'                            => $plan->current_age,
            'target_retirement_age'                  => $plan->target_retirement_age,
            'expected_monthly_expense_at_retirement' => (float) $plan->expected_monthly_expense_at_retirement,
            'life_expectancy'                        => $plan->life_expectancy,
            'expected_annual_inflation_rate'         => (float) $plan->expected_annual_inflation_rate,
            'expected_portfolio_return_rate'         => (float) $plan->expected_portfolio_return_rate,
            'expected_retirement_return_rate'        => (float) $plan->expected_retirement_return_rate,
            'monthly_contribution'                   => (float) $plan->monthly_contribution,
            'include_agro_income'                    => $plan->include_agro_income,
            'agro_monthly_equivalent'                => $plan->agro_monthly_equivalent ? (float) $plan->agro_monthly_equivalent : null,
            'notes'                                  => $plan->notes,
            'years_to_retirement'                    => $plan->years_to_retirement,
            'retirement_years'                       => $plan->retirement_years,
            'total_monthly_contribution'             => $plan->total_monthly_contribution,
        ];
    }
}
