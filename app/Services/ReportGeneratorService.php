<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Asset;
use App\Models\CropCycle;
use App\Models\FixedExpense;
use App\Models\FixedExpenseCheck;
use App\Models\Liability;
use App\Models\LiabilityPayment;
use App\Models\Report;
use App\Models\Transaction;
use App\Models\Transfer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReportGeneratorService
{
    private const MONTH_NAMES = [
        1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
        5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
        9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
    ];

    public function __construct(private readonly AssetBalanceService $assetService) {}

    public function generate(Report $report): void
    {
        $report->update(['status' => 'generating', 'error_message' => null]);

        try {
            $data = $this->gatherData($report->year, $report->month);

            $this->validateData($data, $report->year, $report->month);

            $pdf = Pdf::loadView('reports.monthly', compact('data'))
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled'      => false,
                    'defaultFont'          => 'DejaVu Sans',
                    'dpi'                  => 120,
                    'chroot'               => public_path(),
                ]);

            $path = "reports/{$report->tenant_id}/{$report->year}-{$report->month}.pdf";
            Storage::put($path, $pdf->output());

            $report->update([
                'status'    => 'completed',
                'file_path' => $path,
                'file_size' => Storage::size($path),
            ]);
        } catch (\Throwable $e) {
            $report->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // DATA GATHERING  (all dates use the 'date' column, not created_at)
    // ──────────────────────────────────────────────────────────────────

    private function gatherData(int $year, int $month): array
    {
        $monthStart     = Carbon::create($year, $month, 1)->startOfDay();
        $monthEnd       = $monthStart->copy()->endOfMonth()->endOfDay();
        $prevMonthEnd   = $monthStart->copy()->subDay()->endOfDay();          // last day of previous month
        $prevMonthStart = $prevMonthEnd->copy()->startOfMonth()->startOfDay();
        $isPastMonth    = $monthStart->lt(Carbon::now()->startOfMonth());

        // ── 1. Transactions for report month (filter by date, not created_at) ──
        $transactions = Transaction::with(['categoryModel', 'account'])
            ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->get();

        $prevTransactions = Transaction::with(['categoryModel', 'account'])
            ->whereBetween('date', [$prevMonthStart->toDateString(), $prevMonthEnd->toDateString()])
            ->get();

        $income       = $transactions->where('type', 'income');
        $expenses     = $transactions->where('type', 'expense');
        $prevIncome   = $prevTransactions->where('type', 'income');
        $prevExpenses = $prevTransactions->where('type', 'expense');

        $totalIncome       = (float) $income->sum('amount');
        $totalExpenses     = (float) $expenses->sum('amount');
        $prevTotalIncome   = (float) $prevIncome->sum('amount');
        $prevTotalExpenses = (float) $prevExpenses->sum('amount');

        $incomeByCategory = $this->groupByCategory($income, $totalIncome);
        $expByCategory    = $this->groupByCategory($expenses, $totalExpenses);
        $prevIncByCat     = $prevIncome->groupBy(fn ($t) => $this->catKey($t))->map(fn ($g) => (float) $g->sum('amount'));
        $prevExpByCat     = $prevExpenses->groupBy(fn ($t) => $this->catKey($t))->map(fn ($g) => (float) $g->sum('amount'));

        // ── 2. Assets — use AssetBalanceService (reuses existing EA compounding) ──
        $assetModels = Asset::all();
        $assetsData  = $assetModels->map(function (Asset $asset) use ($monthStart, $monthEnd): array {
            // computeAt uses the exact same EA compound interest logic already built
            $startResult = $this->assetService->computeAt($asset, $monthStart->copy()->subDay());
            $endResult   = $this->assetService->computeAt($asset, $monthEnd->copy());

            $movements = $asset->movements()
                ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->get();

            $deposits    = (float) $movements->where('amount', '>', 0)->sum('amount');
            $withdrawals = (float) abs($movements->where('amount', '<', 0)->sum('amount'));
            $movNet      = $deposits - $withdrawals;

            // Interest this month = end_balance − start_balance − net_movements
            $interestThisMonth = max(0.0, $endResult['balance'] - $startResult['balance'] - $movNet);

            // Total interest since the asset's own start_date
            $interestSinceInception = $endResult['interest_earned'];

            // Projected value at maturity date
            $maturityValue = null;
            if ($asset->maturity_date) {
                $mat           = $this->assetService->computeAt($asset, Carbon::parse($asset->maturity_date));
                $maturityValue = $mat['balance'];
            }

            // Progress through the investment term (for progress bar)
            $assetStart  = Carbon::parse($asset->start_date);
            $termDays    = $asset->maturity_date
                ? max(1, $assetStart->diffInDays(Carbon::parse($asset->maturity_date)))
                : 365;
            $elapsedDays = max(0, $assetStart->diffInDays($monthEnd));
            $progress    = min(100, (int) round(($elapsedDays / $termDays) * 100));

            return [
                'name'                    => $asset->name,
                'type'                    => $asset->type,
                'rate_ea'                 => $asset->rate_ea ? (float) $asset->rate_ea : null,
                'start_date'              => $assetStart->format('d/m/Y'),
                'maturity_date'           => $asset->maturity_date?->format('d/m/Y'),
                'days_to_mat'             => $asset->maturity_date
                    ? max(0, (int) Carbon::today()->diffInDays(Carbon::parse($asset->maturity_date), false))
                    : null,
                'start_balance'           => $startResult['balance'],
                'deposits'                => $deposits,
                'withdrawals'             => $withdrawals,
                'interest_this_month'     => $interestThisMonth,
                'interest_since_inception'=> $interestSinceInception,
                'end_balance'             => $endResult['balance'],
                'maturity_value'          => $maturityValue,
                'progress_pct'            => $progress,
            ];
        });

        // Asset portfolio totals
        $assetPortfolioEnd   = (float) $assetsData->sum('end_balance');
        $assetPortfolioStart = (float) $assetsData->sum('start_balance');

        // ── 3. Bank accounts ───────────────────────────────────────────────────
        $accounts     = Account::where('is_active', true)->get();
        $allAccounts  = Account::all();

        // Net worth = bank accounts (non-CC positive, CC negative) + investment assets − liabilities
        $bankNwEnd   = $this->computeNetWorthAt($accounts, $monthEnd);
        $bankNwStart = $this->computeNetWorthAt($accounts, $monthStart->copy()->subDay());
        $bankNwPrev  = $this->computeNetWorthAt($accounts, $prevMonthEnd);

        // Previous month asset portfolio
        $assetPortfolioPrev = (float) $assetModels->sum(
            fn (Asset $a) => $this->assetService->computeAt($a, $prevMonthEnd->copy())['balance']
        );

        // Liabilities reduce net worth
        $activeLiabilities    = Liability::where('status', 'active')->get();
        $totalLiabilityDebt   = (float) $activeLiabilities->sum('outstanding_balance');

        $netWorthEnd   = $bankNwEnd   + $assetPortfolioEnd   - $totalLiabilityDebt;
        $netWorthStart = $bankNwStart + $assetPortfolioStart - $totalLiabilityDebt;
        $prevNetWorth  = $bankNwPrev  + $assetPortfolioPrev  - $totalLiabilityDebt;

        // Liabilities data for report section
        $liabilityData = $activeLiabilities->map(function (Liability $l) use ($monthStart, $monthEnd): array {
            $payments = LiabilityPayment::where('liability_id', $l->id)
                ->whereBetween('payment_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->get();

            $scheduledPayment = $l->monthly_payment;
            $totalPaid        = (float) $payments->sum('total_paid');
            $principalPaid    = (float) $payments->sum('principal_paid');
            $interestPaid     = (float) $payments->sum('interest_paid');
            $missed           = $payments->isEmpty() && $monthEnd->lt(Carbon::now());

            return [
                'name'              => $l->name,
                'type'              => $l->type,
                'outstanding'       => (float) $l->outstanding_balance,
                'monthly_payment'   => (float) $scheduledPayment,
                'annual_rate'       => (float) $l->annual_interest_rate,
                'payments_count'    => $payments->count(),
                'total_paid'        => $totalPaid,
                'principal_paid'    => $principalPaid,
                'interest_paid'     => $interestPaid,
                'missed'            => $missed,
            ];
        });

        // Account detail (all accounts, including inactive, for history)
        $accountsData = $allAccounts->map(function (Account $acc) use ($monthStart, $monthEnd): array {
            $opening = $this->computeAccountBalanceAt($acc, $monthStart->copy()->subDay());
            $closing = $this->computeAccountBalanceAt($acc, $monthEnd);
            $tx      = $acc->transactions()->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])->get();
            $inflows  = (float) $tx->where('type', 'income')->sum('amount');
            $outflows = (float) $tx->where('type', 'expense')->sum('amount');
            $trIn  = (float) Transfer::where('to_account_id', $acc->id)
                ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->sum('amount');
            $trOut = (float) Transfer::where('from_account_id', $acc->id)
                ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
                ->sum('amount');

            return [
                'name'           => $acc->name,
                'type'           => $acc->type,
                'is_credit_card' => $acc->isCreditCard(),
                'opening'        => $opening,
                'inflows'        => $inflows,
                'outflows'       => $outflows,
                'transfers_in'   => $trIn,
                'transfers_out'  => $trOut,
                'closing'        => $closing,
            ];
        });

        // ── 4. Savings rate ────────────────────────────────────────────────────
        $savingsRate     = $totalIncome > 0 ? (($totalIncome - $totalExpenses) / $totalIncome) * 100 : 0;
        $prevSavingsRate = $prevTotalIncome > 0 ? (($prevTotalIncome - $prevTotalExpenses) / $prevTotalIncome) * 100 : 0;

        // ── 5. Fixed expenses — query by report month/year, not current month ──
        $fixedExpenses      = FixedExpense::where('is_active', true)->with('categoryModel')->get();
        $fixedExpenseIds    = $fixedExpenses->pluck('id');

        $feChecks = FixedExpenseCheck::where('month', $month)
            ->where('year', $year)
            ->whereIn('fixed_expense_id', $fixedExpenseIds)
            ->get()
            ->keyBy('fixed_expense_id');

        // Previous month checks (to detect consecutive misses)
        $prevFEChecks = FixedExpenseCheck::where('month', $prevMonthStart->month)
            ->where('year', $prevMonthStart->year)
            ->whereIn('fixed_expense_id', $fixedExpenseIds)
            ->get()
            ->keyBy('fixed_expense_id');

        $fixedExpenseData = $fixedExpenses->map(function ($fe) use ($feChecks, $prevFEChecks): array {
            $check     = $feChecks->get($fe->id);
            $prevCheck = $prevFEChecks->get($fe->id);
            $isPaid    = $check?->is_paid ?? false;
            $prevPaid  = $prevCheck?->is_paid ?? false;

            return [
                'name'                => $fe->name,
                'amount'              => (float) $fe->amount,
                'category'            => $fe->categoryModel?->name ?? $fe->category ?? '—',
                'is_paid'             => $isPaid,
                'paid_at'             => $check?->paid_at?->format('d/m/Y') ?? null,
                'has_transaction'     => ! is_null($check?->transaction_id),
                'missed_consecutive'  => ! $isPaid && ! $prevPaid,
            ];
        });

        // ── 6. Crop cycles ─────────────────────────────────────────────────────
        $cropCycles = CropCycle::whereIn('status', ['active', 'harvested'])
            ->where('sown_at', '<=', $monthEnd->toDateString())
            ->where(function ($q) use ($monthStart): void {
                $q->whereNull('harvested_at')->orWhere('harvested_at', '>=', $monthStart->toDateString());
            })
            ->with(['expenses.categoryModel', 'sales'])
            ->get();

        $cropData = $cropCycles->map(function (CropCycle $cycle) use ($monthStart, $monthEnd): array {
            $monthExp   = $cycle->expenses->filter(fn ($e) => $e->expense_date->between($monthStart, $monthEnd));
            $monthSales = $cycle->sales->filter(fn ($s) => $s->sale_date->between($monthStart, $monthEnd));
            $byPhase    = $monthExp->groupBy('phase')->map(fn ($g) => (float) $g->sum('amount'));

            $totalExp = (float) $cycle->expenses->sum('amount');
            $totalRev = (float) $cycle->sales->sum(fn ($s) => $s->quantity * $s->unit_price);

            $daysToHarvest = null;
            if ($cycle->expected_harvest_at) {
                $daysToHarvest = max(0, (int) Carbon::today()->diffInDays($cycle->expected_harvest_at, false));
            }

            return [
                'crop_type'       => $cycle->crop_type,
                'location'        => $cycle->location,
                'status'          => $cycle->status,
                'sown_at'         => $cycle->sown_at->format('d/m/Y'),
                'expected_harvest'=> $cycle->expected_harvest_at?->format('d/m/Y'),
                'days_to_harvest' => $daysToHarvest,
                'month_expenses'  => (float) $monthExp->sum('amount'),
                'month_revenue'   => (float) $monthSales->sum(fn ($s) => $s->quantity * $s->unit_price),
                'expenses_phase'  => $byPhase,
                'total_expenses'  => $totalExp,
                'total_revenue'   => $totalRev,
                'profit'          => $totalRev - $totalExp,
            ];
        });

        // ── 7. 6-month trend ending on report month (not today) ─────────────
        $trend = [];
        for ($i = 5; $i >= 0; $i--) {
            $td   = Carbon::create($year, $month, 1)->subMonths($i);
            $ts   = $td->copy()->startOfMonth();
            $te   = $td->copy()->endOfMonth();
            $txs  = Transaction::whereBetween('date', [$ts->toDateString(), $te->toDateString()])->get();

            $trendBankNw    = $this->computeNetWorthAt($accounts, $te);
            $trendAssetNw   = (float) $assetModels->sum(
                fn (Asset $a) => $this->assetService->computeAt($a, $te->copy())['balance']
            );

            $trend[] = [
                'label'       => self::MONTH_NAMES[$td->month] . ' ' . $td->year,
                'short'       => strtoupper(substr(self::MONTH_NAMES[$td->month], 0, 3)) . ' ' . substr($td->year, 2),
                'income'      => (float) $txs->where('type', 'income')->sum('amount'),
                'expenses'    => (float) $txs->where('type', 'expense')->sum('amount'),
                'net_worth'   => $trendBankNw + $trendAssetNw,
                'asset_total' => $trendAssetNw,
            ];
        }

        // ── 8. Observations ────────────────────────────────────────────────────
        $observations = $this->generateObservations([
            'year'                  => $year,
            'month'                 => $month,
            'total_income'          => $totalIncome,
            'total_expenses'        => $totalExpenses,
            'prev_total_income'     => $prevTotalIncome,
            'prev_total_expenses'   => $prevTotalExpenses,
            'savings_rate'          => $savingsRate,
            'prev_savings_rate'     => $prevSavingsRate,
            'net_worth_end'         => $netWorthEnd,
            'net_worth_start'       => $netWorthStart,
            'expenses_by_category'  => $expByCategory,
            'prev_exp_by_category'  => $prevExpByCat,
            'fixed_expenses'        => $fixedExpenseData,
            'assets'                => $assetsData,
            'crop_cycles'           => $cropData,
        ]);

        $tenant = tenancy()->tenant;

        return [
            'tenant_name'          => $tenant->name,
            'month'                => $month,
            'year'                 => $year,
            'month_name'           => self::MONTH_NAMES[$month] . ' ' . $year,
            'prev_month_name'      => self::MONTH_NAMES[$prevMonthStart->month],
            'generated_at'         => Carbon::now()->format('d/m/Y \a \l\a\s H:i'),
            'is_past_month'        => $isPastMonth,

            'summary' => [
                'total_income'       => $totalIncome,
                'prev_income'        => $prevTotalIncome,
                'total_expenses'     => $totalExpenses,
                'prev_expenses'      => $prevTotalExpenses,
                'net_result'         => $totalIncome - $totalExpenses,
                'prev_net'           => $prevTotalIncome - $prevTotalExpenses,
                'net_worth'          => $netWorthEnd,
                'prev_net_worth'     => $prevNetWorth,
                'savings_rate'       => $savingsRate,
                'prev_savings_rate'  => $prevSavingsRate,
                'asset_portfolio'    => $assetPortfolioEnd,
            ],

            'income_by_category'   => $incomeByCategory,
            'prev_income_by_cat'   => $prevIncByCat,
            'expenses_by_category' => $expByCategory,
            'prev_exp_by_cat'      => $prevExpByCat,
            'fixed_expenses'       => $fixedExpenseData,
            'assets'               => $assetsData,
            'accounts'             => $accountsData,
            'crop_cycles'          => $cropData,
            'has_agro'             => $cropData->isNotEmpty(),
            'trend'                => $trend,
            'observations'         => $observations,
            'liabilities'          => $liabilityData,
            'total_liability_debt' => $totalLiabilityDebt,
        ];
    }

    // ──────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────

    private function groupByCategory(Collection $transactions, float $total): Collection
    {
        return $transactions
            ->groupBy(fn ($t) => $this->catKey($t))
            ->map(function ($group) use ($total): array {
                $amount = (float) $group->sum('amount');
                return [
                    'name'  => $group->first()->categoryModel?->name ?? $group->first()->category ?? 'Sin categoría',
                    'color' => $group->first()->categoryModel?->color ?? '#9ca3af',
                    'amount'=> $amount,
                    'count' => $group->count(),
                    'pct'   => $total > 0 ? round(($amount / $total) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('amount')
            ->values();
    }

    private function catKey(Transaction $t): string
    {
        return $t->categoryModel?->name ?? $t->category ?? 'Sin categoría';
    }

    private function computeNetWorthAt(Collection $accounts, Carbon $date): float
    {
        return $accounts->reduce(function (float $carry, Account $acc) use ($date): float {
            $balance = $this->computeAccountBalanceAt($acc, $date);
            return $acc->isCreditCard() ? $carry - $balance : $carry + $balance;
        }, 0.0);
    }

    private function computeAccountBalanceAt(Account $account, Carbon $date): float
    {
        $ds      = $date->toDateString();
        $initial = (float) $account->initial_balance;
        $income  = (float) $account->transactions()->where('type', 'income')->where('date', '<=', $ds)->sum('amount');
        $exp     = (float) $account->transactions()->where('type', 'expense')->where('date', '<=', $ds)->sum('amount');
        $in      = (float) Transfer::where('to_account_id', $account->id)->where('date', '<=', $ds)->sum('amount');
        $out     = (float) Transfer::where('from_account_id', $account->id)->where('date', '<=', $ds)->sum('amount');

        return $account->isCreditCard()
            ? $initial + $exp - $income - $in + $out
            : $initial + $income - $exp + $in - $out;
    }

    private function generateObservations(array $d): array
    {
        $obs        = [];
        $reportDate = Carbon::create($d['year'], $d['month'], 1);

        // 1. Expense categories with > 30% increase (with exact amounts)
        foreach ($d['expenses_by_category'] as $cat) {
            $prev = $d['prev_exp_by_category']->get($cat['name'], 0);
            if ($prev > 0) {
                $pct = (($cat['amount'] - $prev) / $prev) * 100;
                if ($pct >= 30) {
                    $obs[] = sprintf(
                        'El gasto en "%s" aumentó %.1f%%: %s → %s.',
                        $cat['name'], $pct, $this->fmtCOP($prev), $this->fmtCOP($cat['amount'])
                    );
                }
            }
        }

        // 2. Net worth change (with percentage)
        $nwChange = $d['net_worth_end'] - $d['net_worth_start'];
        $nwPct    = $d['net_worth_start'] > 0
            ? ($nwChange / abs($d['net_worth_start'])) * 100
            : 0;
        if ($nwChange > 0) {
            $obs[] = sprintf(
                '✓ El patrimonio neto creció %s (%.1f%%) durante el mes.',
                $this->fmtCOP($nwChange), $nwPct
            );
        } elseif ($nwChange < 0) {
            $obs[] = sprintf(
                'El patrimonio neto disminuyó %s (%.1f%%) durante el mes. Revisa gastos o deudas extraordinarias.',
                $this->fmtCOP(abs($nwChange)), abs($nwPct)
            );
        }

        // 3. CDT / fixed-term assets maturing within 60 days
        foreach ($d['assets'] as $a) {
            if ($a['days_to_mat'] !== null && $a['days_to_mat'] >= 0 && $a['days_to_mat'] <= 60) {
                $matVal = $a['maturity_value'] ? ' — Valor proyectado: ' . $this->fmtCOP($a['maturity_value']) . '.' : '';
                $obs[] = sprintf(
                    '⏰ "%s" vence en %d días (%s).%s Planifica el destino de los fondos.',
                    $a['name'], $a['days_to_mat'], $a['maturity_date'], $matVal
                );
            }
        }

        // 4. Savings rate warnings / congratulations
        $sr = $d['savings_rate'];
        if ($sr < 10 && $d['total_income'] > 0) {
            $obs[] = sprintf(
                '⚠ Tasa de ahorro crítica: %.1f%%. Se recomienda reducir gastos variables para alcanzar al menos el 20%%.',
                $sr
            );
        } elseif ($sr >= 30) {
            $obs[] = sprintf(
                '✓ Tasa de ahorro excelente: %.1f%%. Estás ahorrando más del 30%% de tus ingresos este mes.',
                $sr
            );
        } else {
            $psr = $d['prev_savings_rate'];
            $diff = $sr - $psr;
            if (abs($diff) >= 2) {
                $obs[] = sprintf(
                    'Tasa de ahorro: %.1f%% (%s%.1f pp respecto al mes anterior).',
                    $sr, $diff > 0 ? '+' : '', $diff
                );
            }
        }

        // 5. Fixed expenses missed for two consecutive months
        $consecutive = collect($d['fixed_expenses'])->where('missed_consecutive', true);
        foreach ($consecutive as $fe) {
            $obs[] = sprintf(
                '🔴 "%s" no tiene pago registrado en dos meses consecutivos. Verifica si el gasto sigue vigente.',
                $fe['name']
            );
        }

        // 6. General unpaid fixed expenses (not already flagged as consecutive)
        $unpaid = collect($d['fixed_expenses'])->where('is_paid', false)->where('missed_consecutive', false);
        if ($unpaid->isNotEmpty()) {
            $obs[] = sprintf(
                'Sin pago registrado este mes: %s (total %s).',
                $unpaid->pluck('name')->join(', '),
                $this->fmtCOP($unpaid->sum('amount'))
            );
        }

        // 7. Agro cycles: P&L and days to harvest
        foreach ($d['crop_cycles'] as $cycle) {
            if ($cycle['status'] !== 'active') {
                continue;
            }
            $plLabel = $cycle['profit'] >= 0 ? 'ganancia acumulada' : 'pérdida acumulada';
            $harvest = $cycle['days_to_harvest'] !== null
                ? sprintf(' Días a cosecha estimada: %d (%s).', $cycle['days_to_harvest'], $cycle['expected_harvest'] ?? '—')
                : '';
            $obs[] = sprintf(
                '🌱 Ciclo "%s": %s de %s.%s',
                $cycle['crop_type'],
                $plLabel,
                $this->fmtCOP(abs($cycle['profit'])),
                $harvest
            );
        }

        // 8. Overspending (if not already obvious from savings rate warning)
        if ($d['total_expenses'] > $d['total_income'] && $sr >= 10) {
            $obs[] = sprintf(
                'Los gastos superaron los ingresos en %s este mes.',
                $this->fmtCOP($d['total_expenses'] - $d['total_income'])
            );
        }

        return $obs;
    }

    // ──────────────────────────────────────────────────────────────────
    // VALIDATION LOGGING
    // ──────────────────────────────────────────────────────────────────

    private function validateData(array $data, int $year, int $month): void
    {
        $ctx = "[Report {$year}-{$month}]";

        if ($data['summary']['total_income'] == 0 && $data['summary']['total_expenses'] == 0) {
            Log::warning("{$ctx} Both income and expenses are zero. Check transaction date filtering.");
        }
        if ($data['summary']['net_worth'] == 0) {
            Log::warning("{$ctx} Net worth is zero. Check account balances and asset portfolio computation.");
        }
        if (count($data['assets']) === 0) {
            Log::info("{$ctx} No assets found.");
        }
        if (count($data['accounts']) === 0) {
            Log::info("{$ctx} No accounts found.");
        }
        if (count($data['fixed_expenses']) === 0) {
            Log::info("{$ctx} No fixed expenses found.");
        }
        foreach ($data['assets'] as $a) {
            if ($a['end_balance'] == 0) {
                Log::warning("{$ctx} Asset '{$a['name']}' has zero end balance. Start date may be after report period.");
            }
        }
    }

    private function fmtCOP(float $v): string
    {
        return '$ ' . number_format($v, 0, ',', '.');
    }

    private function fmtPct(float $v): string
    {
        return number_format($v, 1) . '%';
    }
}
