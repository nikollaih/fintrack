<?php

namespace App\Http\Controllers;

use App\Http\Resources\TransactionResource;
use App\Models\Account;
use App\Models\Asset;
use App\Models\FixedExpense;
use App\Models\FixedExpenseCheck;
use App\Models\Liability;
use App\Models\RetirementPlan;
use App\Models\Transaction;
use App\Services\AssetBalanceService;
use App\Services\RetirementCalculatorService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AssetBalanceService $service,
        private readonly RetirementCalculatorService $retirementService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $now = Carbon::now();

        // ── Monthly transactions ──────────────────────────────────────
        $monthlyTransactions = Transaction::whereYear('date', $now->year)
            ->whereMonth('date', $now->month)
            ->get();

        $monthlyIncome   = $monthlyTransactions->where('type', 'income')->sum('amount');
        $monthlyExpenses = $monthlyTransactions->where('type', 'expense')->sum('amount');

        $recentTransactions = Transaction::with(['account', 'categoryModel'])
            ->orderByDesc('date')
            ->limit(5)
            ->get();

        // ── Fixed expenses widget ─────────────────────────────────────
        $fixedExpenses = FixedExpense::where('is_active', true)->get();
        $paidIds = FixedExpenseCheck::where('month', $now->month)
            ->where('year', $now->year)
            ->where('is_paid', true)
            ->whereIn('fixed_expense_id', $fixedExpenses->pluck('id'))
            ->pluck('fixed_expense_id');
        $paidExpenses = $fixedExpenses->whereIn('id', $paidIds);
        $fixedExpensesSummary = [
            'total'          => $fixedExpenses->count(),
            'paid'           => $paidExpenses->count(),
            'total_amount'   => (float) $fixedExpenses->sum('amount'),
            'paid_amount'    => (float) $paidExpenses->sum('amount'),
            'pending_amount' => (float) ($fixedExpenses->sum('amount') - $paidExpenses->sum('amount')),
        ];

        // ── Bank accounts — net worth ─────────────────────────────────
        $accounts     = Account::where('is_active', true)->orderBy('name')->get();
        $accountsData = $accounts->map(fn (Account $a): array => [
            'id'             => $a->id,
            'name'           => $a->name,
            'type'           => $a->type,
            'is_credit_card' => $a->isCreditCard(),
            'balance'        => $a->computeBalance(),
            'currency'       => $a->currency,
        ]);
        $totalAssetBalances = (float) $accountsData->filter(fn ($a) => ! $a['is_credit_card'])->sum('balance');
        $totalCcDebt        = (float) $accountsData->filter(fn ($a) => $a['is_credit_card'])->sum('balance');

        // Include liabilities (loans) in net worth calculation
        $activeLiabilities  = Liability::where('status', 'active')->get();
        $totalLiabilityDebt = (float) $activeLiabilities->sum('outstanding_balance');
        $netWorth           = $totalAssetBalances - $totalCcDebt - $totalLiabilityDebt;

        // ── Debt summary widget ───────────────────────────────────────
        $today         = Carbon::today();
        $nextPayment   = $activeLiabilities->sortBy(fn ($l) => $l->payment_day)->first();
        $debtSummary   = [
            'total_debt'          => $totalLiabilityDebt,
            'monthly_commitment'  => (float) $activeLiabilities->sum('monthly_payment'),
            'next_payment_date'   => $nextPayment
                ? $today->copy()->day($nextPayment->payment_day)->toDateString()
                : null,
            'next_payment_name'   => $nextPayment?->name,
            'next_payment_amount' => $nextPayment ? (float) $nextPayment->monthly_payment : null,
            'active_count'        => $activeLiabilities->count(),
        ];

        // ── Investment assets — live computed balances ────────────────
        $assets      = Asset::with('balanceCache')->get();
        $totalAssets = 0.0;

        $assetsData = $assets->map(function (Asset $asset) use (&$totalAssets): array {
            $computed     = $this->service->getCachedOrCompute($asset);
            $totalAssets += $computed['balance'];

            $maturityValue = null;
            if ($asset->maturity_date) {
                $m             = $this->service->computeAt($asset, Carbon::parse($asset->maturity_date));
                $maturityValue = $m['balance'];
            }

            return [
                'id'               => $asset->id,
                'name'             => $asset->name,
                'type'             => $asset->type,
                'initial_balance'  => (float) $asset->initial_balance,
                'rate_ea'          => $asset->rate_ea ? (float) $asset->rate_ea : null,
                'maturity_date'    => $asset->maturity_date?->toDateString(),
                'balance'          => $computed['balance'],
                'interest_earned'  => $computed['interest_earned'],
                'maturity_value'   => $maturityValue,
                'days_to_maturity' => $asset->maturity_date
                    ? max(0, (int) Carbon::today()->diffInDays(Carbon::parse($asset->maturity_date), false))
                    : null,
            ];
        });

        // ── Retirement summary widget ─────────────────────────────────
        $retirementSummary = null;
        $plan = RetirementPlan::first();
        if ($plan) {
            $portfolioAssets = Asset::with('balanceCache')->get();
            $portfolioTotal  = (float) $portfolioAssets->sum(fn (Asset $a) => $this->service->getCachedOrCompute($a)['balance']);
            $corpus          = $this->retirementService->computeRequiredCorpus($plan);
            $gap             = $this->retirementService->computeGapAnalysis($plan, $portfolioTotal);
            $projAge         = $this->retirementService->computeProjectedRetirementAge($plan, $portfolioTotal);
            $retirementSummary = [
                'progress_pct'             => $corpus['nominal'] > 0
                    ? min(100, round($portfolioTotal / $corpus['nominal'] * 100, 1))
                    : 0,
                'projected_retirement_age' => $projAge,
                'target_retirement_age'    => $plan->target_retirement_age,
                'on_track'                 => $gap['on_track'],
                'required_corpus'          => $corpus['nominal'],
                'projected_corpus'         => $gap['projected_corpus'],
            ];
        }

        return Inertia::render('Dashboard/Index', [
            'summary' => [
                'total_assets'     => $totalAssets,
                'monthly_income'   => (float) $monthlyIncome,
                'monthly_expenses' => (float) $monthlyExpenses,
                'net_balance'      => (float) ($monthlyIncome - $monthlyExpenses),
            ],
            'assets'                 => $assetsData->values(),
            'recent_transactions'    => TransactionResource::collection($recentTransactions),
            'fixed_expenses_summary' => $fixedExpensesSummary,
            'accounts_summary'       => [
                'accounts'          => $accountsData->values(),
                'total_assets'      => $totalAssetBalances,
                'total_debt'        => $totalCcDebt,
                'total_liabilities' => $totalLiabilityDebt,
                'net_worth'         => $netWorth,
            ],
            'retirement_summary' => $retirementSummary,
            'debt_summary'       => $activeLiabilities->count() > 0 ? $debtSummary : null,
        ]);
    }
}
