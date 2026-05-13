<?php

namespace App\Services;

use App\Models\Liability;
use App\Models\LiabilityPayment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class LiabilityAmortizationService
{
    /**
     * Generate a full French amortization schedule.
     * Colombian mortgages/personal loans use nominal annual rate / 12.
     * Cooperative loans use effective annual rate converted to monthly.
     *
     * @return array<int, array{number: int, date: string, beginning_balance: float, payment: float, principal: float, interest: float, ending_balance: float}>
     */
    public function generateSchedule(Liability $liability): array
    {
        $principal   = (float) $liability->original_amount;
        $monthlyRate = $liability->monthlyRate();
        $termMonths  = $liability->term_months;
        $payment     = (float) $liability->monthly_payment;
        $paymentDate = $liability->first_payment_date->copy();

        $schedule = [];
        $balance  = $principal;

        for ($i = 1; $i <= $termMonths; $i++) {
            $interest        = round($balance * $monthlyRate, 4);
            $principalChunk  = round(min($payment - $interest, $balance), 4);
            $endingBalance   = round(max(0, $balance - $principalChunk), 4);

            $schedule[] = [
                'number'            => $i,
                'date'              => $paymentDate->toDateString(),
                'beginning_balance' => round($balance, 4),
                'payment'           => round($principalChunk + $interest, 4),
                'principal'         => $principalChunk,
                'interest'          => $interest,
                'ending_balance'    => $endingBalance,
            ];

            $balance = $endingBalance;
            $paymentDate = $paymentDate->copy()->addMonth();

            if ($balance <= 0.01) {
                break;
            }
        }

        return $schedule;
    }

    /**
     * Determine current position: which payment we are on, actual balances, etc.
     *
     * @param  Collection<int, LiabilityPayment>  $payments
     * @return array{current_payment_number: int, actual_balance: float, total_interest_paid: float, total_principal_paid: float, pct_paid: float, projected_payoff_date: string}
     */
    public function currentPosition(Liability $liability, Collection $payments): array
    {
        $schedule        = $this->generateSchedule($liability);
        $paymentsCount   = $payments->count();
        $totalInterest   = (float) $payments->sum('interest_paid');
        $totalPrincipal  = (float) $payments->sum('principal_paid');
        $actualBalance   = $payments->isNotEmpty()
            ? (float) $payments->last()->outstanding_balance_after
            : (float) $liability->outstanding_balance;

        $pctPaid = (float) $liability->original_amount > 0
            ? round(($totalPrincipal / (float) $liability->original_amount) * 100, 2)
            : 0.0;

        // Project payoff from remaining schedule rows
        $remaining       = array_slice($schedule, $paymentsCount);
        $projectedPayoff = ! empty($remaining)
            ? end($remaining)['date']
            : ($payments->isNotEmpty() ? $payments->last()->payment_date->toDateString() : now()->toDateString());

        return [
            'current_payment_number' => $paymentsCount,
            'actual_balance'         => $actualBalance,
            'total_interest_paid'    => $totalInterest,
            'total_principal_paid'   => $totalPrincipal,
            'pct_paid'               => $pctPaid,
            'projected_payoff_date'  => $projectedPayoff,
        ];
    }

    /**
     * Simulate the effect of extra monthly payments and/or a one-time lump sum.
     *
     * @return array{months_saved: int, new_payoff_date: string, interest_saved: float, total_interest_new: float, schedule: array}
     */
    public function simulateExtraPayment(
        Liability $liability,
        float $extraMonthly,
        ?float $lumpSum = null,
        ?Carbon $lumpSumDate = null,
    ): array {
        $monthlyRate   = $liability->monthlyRate();
        $payment       = (float) $liability->monthly_payment + $extraMonthly;
        $balance       = (float) $liability->outstanding_balance;
        $paymentDate   = $liability->first_payment_date->copy();
        $today         = Carbon::today();

        // Advance to current position based on registered payments
        $payments = $liability->payments;
        if ($payments->isNotEmpty()) {
            $balance     = (float) $payments->last()->outstanding_balance_after;
            $paymentDate = $payments->last()->payment_date->copy()->addMonth();
        }

        $originalSchedule = $this->generateSchedule($liability);
        $originalTotal    = array_sum(array_column($originalSchedule, 'interest'));

        $newSchedule   = [];
        $totalInterest = 0.0;
        $num           = $payments->count() + 1;
        $lumpApplied   = false;

        while ($balance > 0.01 && count($newSchedule) < 600) {
            // Apply lump sum if date reached
            if (! $lumpApplied && $lumpSum && $lumpSumDate && $paymentDate->gte($lumpSumDate)) {
                $balance    = max(0, $balance - $lumpSum);
                $lumpApplied = true;
            }

            $interest       = round($balance * $monthlyRate, 4);
            $effectivePayment = min($payment, $balance + $interest);
            $principalChunk = round($effectivePayment - $interest, 4);
            $endingBalance  = round(max(0, $balance - $principalChunk), 4);
            $totalInterest += $interest;

            $newSchedule[] = [
                'number'            => $num,
                'date'              => $paymentDate->toDateString(),
                'beginning_balance' => round($balance, 4),
                'payment'           => round($effectivePayment, 4),
                'principal'         => $principalChunk,
                'interest'          => $interest,
                'ending_balance'    => $endingBalance,
            ];

            $balance     = $endingBalance;
            $paymentDate = $paymentDate->copy()->addMonth();
            $num++;
        }

        $originalPayoffDate = ! empty($originalSchedule) ? end($originalSchedule)['date'] : today()->toDateString();
        $newPayoffDate      = ! empty($newSchedule) ? end($newSchedule)['date'] : today()->toDateString();

        $monthsSaved = (int) max(0, Carbon::parse($originalPayoffDate)->diffInMonths(Carbon::parse($newPayoffDate), false) * -1);

        return [
            'months_saved'      => $monthsSaved,
            'new_payoff_date'   => $newPayoffDate,
            'interest_saved'    => round($originalTotal - $totalInterest, 4),
            'total_interest_new' => round($totalInterest, 4),
            'schedule'          => $newSchedule,
        ];
    }

    /**
     * Simulate refinancing with new terms.
     *
     * @return array{keep_total_cost: float, refi_total_cost: float, interest_saved: float, break_even_months: int, recommended: bool, penalty_amount: float}
     */
    public function simulateRefinancing(
        Liability $liability,
        float $newAnnualRate,
        int $newTermMonths,
        float $newMonthlyPayment,
    ): array {
        $balance = (float) $liability->outstanding_balance;
        $payments = $liability->payments;
        if ($payments->isNotEmpty()) {
            $balance = (float) $payments->last()->outstanding_balance_after;
        }

        $penalty = $liability->early_payment_penalty_rate
            ? round($balance * (float) $liability->early_payment_penalty_rate, 4)
            : 0.0;

        // Cost of keeping current loan
        $currentSchedule    = $this->generateSchedule($liability);
        $paymentsCount      = $payments->count();
        $remaining          = array_slice($currentSchedule, $paymentsCount);
        $keepTotalInterest  = (float) array_sum(array_column($remaining, 'interest'));
        $keepTotalCost      = $keepTotalInterest + $penalty;

        // Cost of refinancing
        $newMonthlyRate = $this->effectiveMonthlyRate($newAnnualRate, false);
        $refiInterest   = 0.0;
        $refiBalance    = $balance + $penalty;
        for ($i = 0; $i < $newTermMonths; $i++) {
            $interest     = $refiBalance * $newMonthlyRate;
            $principalC   = $newMonthlyPayment - $interest;
            $refiInterest += $interest;
            $refiBalance  -= $principalC;
            if ($refiBalance <= 0.01) {
                break;
            }
        }

        $refiTotalCost  = round($refiInterest, 4);
        $interestSaved  = round($keepTotalInterest - $refiInterest, 4);

        // Break-even: how many months of lower payment covers the penalty
        $monthlyDiff    = (float) $liability->monthly_payment - $newMonthlyPayment;
        $breakEven      = $monthlyDiff > 0 ? (int) ceil($penalty / $monthlyDiff) : PHP_INT_MAX;

        return [
            'keep_total_cost'   => round($keepTotalCost, 4),
            'refi_total_cost'   => $refiTotalCost,
            'interest_saved'    => $interestSaved,
            'break_even_months' => $breakEven,
            'recommended'       => $interestSaved > $penalty && $breakEven < $newTermMonths,
            'penalty_amount'    => $penalty,
        ];
    }

    /**
     * Optimal extra payment allocation across multiple liabilities.
     *
     * @param  Collection<int, Liability>  $liabilities
     * @return array{avalanche: array, snowball: array, avalanche_total_interest: float, snowball_total_interest: float, interest_difference: float}
     */
    public function optimalExtraPayment(Collection $liabilities, float $budget): array
    {
        $active = $liabilities->where('status', 'active');

        $avalanche = $active->sortByDesc('annual_interest_rate')->values();
        $snowball   = $active->sortBy('outstanding_balance')->values();

        $allocate = function (Collection $sorted) use ($budget): array {
            $result       = [];
            $remaining    = $budget;

            foreach ($sorted as $liability) {
                if ($remaining <= 0) {
                    break;
                }
                $alloc = min($remaining, $budget);
                $sim   = $this->simulateExtraPayment($liability, $alloc);

                $result[] = [
                    'liability_id'   => $liability->id,
                    'liability_name' => $liability->name,
                    'allocation'     => $alloc,
                    'months_saved'   => $sim['months_saved'],
                    'interest_saved' => $sim['interest_saved'],
                ];
                $remaining -= $alloc;
            }

            return $result;
        };

        $avalancheResult        = $allocate($avalanche);
        $snowballResult         = $allocate($snowball);
        $avalancheTotalInterest = array_sum(array_column($avalancheResult, 'interest_saved'));
        $snowballTotalInterest  = array_sum(array_column($snowballResult, 'interest_saved'));

        return [
            'avalanche'               => $avalancheResult,
            'snowball'                => $snowballResult,
            'avalanche_total_interest' => $avalancheTotalInterest,
            'snowball_total_interest'  => $snowballTotalInterest,
            'interest_difference'     => abs($avalancheTotalInterest - $snowballTotalInterest),
        ];
    }

    /**
     * Compute summary totals for all active liabilities.
     *
     * @param  Collection<int, Liability>  $liabilities
     * @return array{total_debt: float, monthly_commitment: float, total_remaining_interest: float, debt_free_date: string|null}
     */
    public function summaryTotals(Collection $liabilities): array
    {
        $active           = $liabilities->where('status', 'active');
        $totalDebt        = (float) $active->sum('outstanding_balance');
        $monthlyCommit    = (float) $active->sum('monthly_payment');
        $totalRemainingInterest = 0.0;
        $latestPayoffDate = null;

        foreach ($active as $liability) {
            $schedule = $this->generateSchedule($liability);
            $paidCount = $liability->payments->count();
            $remaining = array_slice($schedule, $paidCount);
            $totalRemainingInterest += array_sum(array_column($remaining, 'interest'));

            $payoffDate = ! empty($remaining) ? end($remaining)['date'] : null;
            if ($payoffDate && (! $latestPayoffDate || $payoffDate > $latestPayoffDate)) {
                $latestPayoffDate = $payoffDate;
            }
        }

        return [
            'total_debt'              => round($totalDebt, 2),
            'monthly_commitment'      => round($monthlyCommit, 2),
            'total_remaining_interest' => round($totalRemainingInterest, 2),
            'debt_free_date'          => $latestPayoffDate,
        ];
    }

    private function effectiveMonthlyRate(float $annualRate, bool $isEA): float
    {
        return $isEA ? pow(1 + $annualRate, 1 / 12) - 1 : $annualRate / 12;
    }
}
