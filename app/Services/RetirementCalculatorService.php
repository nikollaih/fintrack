<?php

namespace App\Services;

use App\Models\RetirementPlan;

class RetirementCalculatorService
{
    // ──────────────────────────────────────────────────────────────────
    // PRIMITIVE HELPERS
    // ──────────────────────────────────────────────────────────────────

    /** Annual rate → monthly equivalent rate. */
    private function mr(float $annualRate): float
    {
        return pow(1 + $annualRate, 1 / 12) - 1;
    }

    /**
     * Future value of a lump sum + regular contributions.
     *   FV = PV*(1+r)^n + C * ((1+r)^n - 1) / r
     */
    public function futureValue(float $pv, float $monthlyContrib, float $monthlyRate, int $months): float
    {
        if ($months <= 0) {
            return $pv;
        }
        if (abs($monthlyRate) < 1e-9) {
            return $pv + $monthlyContrib * $months;
        }
        $factor = pow(1 + $monthlyRate, $months);
        return $pv * $factor + $monthlyContrib * ($factor - 1) / $monthlyRate;
    }

    /**
     * Required monthly payment to reach a target FV.
     *   C = (FV - PV*(1+r)^n) * r / ((1+r)^n - 1)
     */
    public function requiredPayment(float $pv, float $targetFv, float $monthlyRate, int $months): float
    {
        if ($months <= 0) {
            return 0;
        }
        if (abs($monthlyRate) < 1e-9) {
            $needed = $targetFv - $pv;
            return $needed > 0 ? $needed / $months : 0;
        }
        $factor = pow(1 + $monthlyRate, $months);
        $pvGrowth = $pv * $factor;
        if ($pvGrowth >= $targetFv) {
            return 0.0; // already on track with no additional contributions
        }
        return ($targetFv - $pvGrowth) * $monthlyRate / ($factor - 1);
    }

    /**
     * Present value of a growing annuity (inflation-adjusted withdrawals).
     * C: first payment, mr: monthly portfolio return, mi: monthly inflation, n: months.
     */
    private function pvGrowingAnnuity(float $c, float $mr, float $mi, int $n): float
    {
        if (abs($mr - $mi) < 1e-9) {
            return $c * $n; // degenerate case
        }
        return $c / ($mr - $mi) * (1 - pow((1 + $mi) / (1 + $mr), $n));
    }

    // ──────────────────────────────────────────────────────────────────
    // CORE CALCULATIONS
    // ──────────────────────────────────────────────────────────────────

    /**
     * Required corpus at retirement.
     *
     * Inflation inflates the monthly expense from today to retirement.
     * Then we calculate the PV of a growing annuity that covers
     * inflation-adjusted monthly expenses through life expectancy.
     *
     * Returns: [nominal, real_today_pesos, monthly_expense_at_retirement]
     */
    public function computeRequiredCorpus(RetirementPlan $plan, ?float $overrideReturnRate = null): array
    {
        $years = $plan->years_to_retirement;
        $retYears = $plan->retirement_years;
        $inflation = (float) $plan->expected_annual_inflation_rate;
        $retReturn = $overrideReturnRate ?? (float) $plan->expected_retirement_return_rate;

        $mi = $this->mr($inflation);
        $mr = $this->mr($retReturn);

        // Monthly expense at the moment of retirement (nominal future pesos)
        $expenseAtRet = (float) $plan->expected_monthly_expense_at_retirement * pow(1 + $inflation, $years);

        $n = $retYears * 12;
        $corpusNominal = $this->pvGrowingAnnuity($expenseAtRet, $mr, $mi, $n);

        $corpusReal = $corpusNominal / pow(1 + $inflation, $years);

        return [
            'nominal'                       => round($corpusNominal, 2),
            'real'                          => round($corpusReal, 2),
            'monthly_expense_at_retirement' => round($expenseAtRet, 2),
        ];
    }

    /**
     * Compute the required corpus if the user retires at a specific age
     * (used for finding the "crossing point" on the chart).
     */
    public function requiredCorpusAtAge(RetirementPlan $plan, float $ageAtRetirement): float
    {
        $yearsToRet = $ageAtRetirement - $plan->current_age;
        if ($yearsToRet < 0) {
            return PHP_FLOAT_MAX;
        }
        $retYears = max(1, $plan->life_expectancy - $ageAtRetirement);
        $inflation = (float) $plan->expected_annual_inflation_rate;
        $retReturn = (float) $plan->expected_retirement_return_rate;

        $mi = $this->mr($inflation);
        $mr = $this->mr($retReturn);
        $expense = (float) $plan->expected_monthly_expense_at_retirement * pow(1 + $inflation, $yearsToRet);
        $n = (int) round($retYears * 12);

        return max(0, $this->pvGrowingAnnuity($expense, $mr, $mi, $n));
    }

    /**
     * Project the portfolio value at the target retirement age.
     */
    public function computeCurrentTrajectory(
        RetirementPlan $plan,
        float $portfolioValue,
        ?float $overrideContrib = null,
        ?float $overrideReturnRate = null
    ): float {
        $contrib      = $overrideContrib ?? $plan->total_monthly_contribution;
        $annualReturn = $overrideReturnRate ?? (float) $plan->expected_portfolio_return_rate;
        $mr           = $this->mr($annualReturn);
        $months       = $plan->years_to_retirement * 12;

        return $this->futureValue($portfolioValue, $contrib, $mr, $months);
    }

    /**
     * Monthly contribution needed to hit the required corpus exactly.
     */
    public function computeRequiredMonthlyContribution(
        RetirementPlan $plan,
        float $portfolioValue,
        ?float $overrideReturnRate = null
    ): float {
        $corpus  = $this->computeRequiredCorpus($plan)['nominal'];
        $mr      = $this->mr($overrideReturnRate ?? (float) $plan->expected_portfolio_return_rate);
        $months  = $plan->years_to_retirement * 12;

        return round(max(0, $this->requiredPayment($portfolioValue, $corpus, $mr, $months)), 2);
    }

    /**
     * Age at which the user could retire at current contribution pace.
     * Iterates monthly until portfolio >= required corpus at that age.
     */
    public function computeProjectedRetirementAge(
        RetirementPlan $plan,
        float $portfolioValue,
        ?float $overrideContrib = null,
        ?float $overrideReturnRate = null
    ): int {
        $contrib = $overrideContrib ?? $plan->total_monthly_contribution;
        $mr      = $this->mr($overrideReturnRate ?? (float) $plan->expected_portfolio_return_rate);
        $pv      = $portfolioValue;
        $maxAge  = 99;

        for ($month = 1; $month <= ($maxAge - $plan->current_age) * 12; $month++) {
            $pv  = $pv * (1 + $mr) + $contrib;
            $age = $plan->current_age + $month / 12;
            if ($pv >= $this->requiredCorpusAtAge($plan, $age)) {
                return (int) floor($age);
            }
        }

        return $maxAge;
    }

    /**
     * Gap analysis: difference between projected and required at target age.
     */
    public function computeGapAnalysis(
        RetirementPlan $plan,
        float $portfolioValue,
        ?float $overrideContrib = null,
        ?float $overrideReturnRate = null
    ): array {
        $required  = $this->computeRequiredCorpus($plan)['nominal'];
        $projected = $this->computeCurrentTrajectory($plan, $portfolioValue, $overrideContrib, $overrideReturnRate);
        $gap       = $projected - $required;
        $pct       = $required > 0 ? ($gap / $required) * 100 : 0;

        return [
            'required_corpus'  => round($required, 2),
            'projected_corpus' => round($projected, 2),
            'gap_amount'       => round($gap, 2),
            'gap_pct'          => round($pct, 1),
            'on_track'         => $gap >= 0,
        ];
    }

    /**
     * Monthly passive income the portfolio generates at retirement.
     * years=0 → perpetual (never touch principal): income = corpus × monthly_rate
     */
    public function computeMonthlyPassiveIncome(float $corpus, float $annualRetRate, int $years = 0): float
    {
        $mr = $this->mr($annualRetRate);
        if ($years === 0 || abs($mr) < 1e-9) {
            return $corpus * $mr;
        }
        $n = $years * 12;
        // PMT of ordinary annuity
        return $corpus * $mr / (1 - pow(1 + $mr, -$n));
    }

    /**
     * Full scenario for a given accumulation return rate.
     */
    public function computeScenario(RetirementPlan $plan, float $portfolioValue, float $returnRate): array
    {
        $gap     = $this->computeGapAnalysis($plan, $portfolioValue, null, $returnRate);
        $retRate = (float) $plan->expected_retirement_return_rate;

        return [
            'return_rate'            => $returnRate,
            'projected_corpus'       => $gap['projected_corpus'],
            'meets_goal'             => $gap['on_track'],
            'gap'                    => $gap['gap_amount'],
            'gap_pct'                => $gap['gap_pct'],
            'required_contribution'  => $this->computeRequiredMonthlyContribution($plan, $portfolioValue, $returnRate),
            'passive_income_perp'    => round($this->computeMonthlyPassiveIncome($gap['projected_corpus'], $retRate, 0), 2),
            'passive_income_25y'     => round($this->computeMonthlyPassiveIncome($gap['projected_corpus'], $retRate, 25), 2),
            'passive_income_30y'     => round($this->computeMonthlyPassiveIncome($gap['projected_corpus'], $retRate, 30), 2),
            'projected_retirement_age' => $this->computeProjectedRetirementAge($plan, $portfolioValue, null, $returnRate),
        ];
    }

    /**
     * Chart data: portfolio trajectory vs required corpus from current age to life expectancy.
     * Sampled every 3 months to keep data manageable.
     */
    public function computeProjectionChart(
        RetirementPlan $plan,
        float $portfolioValue,
        ?float $overrideContrib = null,
        ?float $overrideReturnRate = null
    ): array {
        $contrib      = $overrideContrib ?? $plan->total_monthly_contribution;
        $accRate      = $this->mr($overrideReturnRate ?? (float) $plan->expected_portfolio_return_rate);
        $retRate      = $this->mr((float) $plan->expected_retirement_return_rate);
        $inflation    = (float) $plan->expected_annual_inflation_rate;
        $mi           = $this->mr($inflation);
        $monthsToRet  = $plan->years_to_retirement * 12;
        $totalMonths  = ($plan->life_expectancy - $plan->current_age) * 12;

        $pv = $portfolioValue;
        $points = [];

        // Corpus at target retirement (fixed reference line)
        $targetCorpus = $this->computeRequiredCorpus($plan)['nominal'];

        for ($m = 0; $m <= $totalMonths; $m += 3) {
            $age = $plan->current_age + $m / 12;

            // Portfolio trajectory
            if ($m <= $monthsToRet) {
                $portfolio = $this->futureValue($portfolioValue, $contrib, $accRate, $m);
            } else {
                // Post-retirement: portfolio was at retirementFV, now withdrawing
                $retFV         = $this->futureValue($portfolioValue, $contrib, $accRate, $monthsToRet);
                $monthsIntoRet = $m - $monthsToRet;
                // Simulate withdrawal of inflation-adjusted monthly expense
                $portfolio = $retFV;
                $expFirstMonth = (float) $plan->expected_monthly_expense_at_retirement * pow(1 + $inflation, $plan->years_to_retirement);
                for ($k = 0; $k < $monthsIntoRet; $k++) {
                    $expense   = $expFirstMonth * pow(1 + $mi, $k);
                    $portfolio = $portfolio * (1 + $retRate) - $expense;
                    if ($portfolio < 0) {
                        $portfolio = 0;
                        break;
                    }
                }
            }

            // Required corpus if retiring at this exact age
            $required = $this->requiredCorpusAtAge($plan, $age);

            $points[] = [
                'age'       => round($age, 2),
                'portfolio' => round(max(0, $portfolio), 2),
                'required'  => round($required, 2),
                'target'    => round($targetCorpus, 2),
            ];
        }

        return $points;
    }

    /**
     * Asset-level projection: each asset's FV at retirement + contributions FV.
     */
    public function computeAssetProjections(
        RetirementPlan $plan,
        array $assetBreakdown,
        float $requiredCorpus
    ): array {
        $mr     = $this->mr((float) $plan->expected_portfolio_return_rate);
        $months = $plan->years_to_retirement * 12;

        $rows = [];
        $totalFv = 0;

        foreach ($assetBreakdown as $a) {
            $fv = $months > 0 ? $a['balance'] * pow(1 + $mr, $months) : $a['balance'];
            $totalFv += $fv;
            $rows[] = [
                'name'                    => $a['name'],
                'type'                    => $a['type'],
                'current_balance'         => $a['balance'],
                'projected_at_retirement' => round($fv, 2),
                'pct_of_corpus'           => $requiredCorpus > 0 ? round(($fv / $requiredCorpus) * 100, 1) : 0,
            ];
        }

        // Monthly contributions as a separate row
        $contrib = $plan->total_monthly_contribution;
        if ($contrib > 0 && $months > 0) {
            $fvContribs = abs($mr) > 1e-9
                ? $contrib * (pow(1 + $mr, $months) - 1) / $mr
                : $contrib * $months;
            $totalFv += $fvContribs;
            $rows[] = [
                'name'                    => 'Contribuciones mensuales ($ ' . number_format($contrib, 0, ',', '.') . '/mes)',
                'type'                    => 'contributions',
                'current_balance'         => 0,
                'projected_at_retirement' => round($fvContribs, 2),
                'pct_of_corpus'           => $requiredCorpus > 0 ? round(($fvContribs / $requiredCorpus) * 100, 1) : 0,
            ];
        }

        // Recalculate pct_of_corpus relative to actual total
        foreach ($rows as &$row) {
            $row['pct_of_total'] = $totalFv > 0 ? round(($row['projected_at_retirement'] / $totalFv) * 100, 1) : 0;
        }

        $rows[] = [
            'name'                    => 'TOTAL PROYECTADO',
            'type'                    => 'total',
            'current_balance'         => array_sum(array_column($rows, 'current_balance')),
            'projected_at_retirement' => round($totalFv, 2),
            'pct_of_corpus'           => $requiredCorpus > 0 ? round(($totalFv / $requiredCorpus) * 100, 1) : 0,
            'pct_of_total'            => 100,
        ];

        return $rows;
    }

    /**
     * Action plan: specific numbered recommendations based on gap.
     */
    public function generateActionPlan(RetirementPlan $plan, float $portfolioValue, array $gap): array
    {
        $actions = [];
        $surplus  = $gap['gap_amount'];
        $required = $gap['required_corpus'];
        $current  = $plan->total_monthly_contribution;
        $reqContrib = $this->computeRequiredMonthlyContribution($plan, $portfolioValue);
        $projAge  = $this->computeProjectedRetirementAge($plan, $portfolioValue);
        $targetAge = $plan->target_retirement_age;

        if ($surplus >= 0) {
            $surplusPct = $required > 0 ? round(($surplus / $required) * 100, 1) : 0;
            $actions[] = "✓ Estás en camino: la proyección supera el objetivo en {$this->fmtCOP($surplus)} ({$surplusPct}% de margen).";

            // How much earlier could they retire with +10% contribution?
            $higherContrib = $current * 1.1;
            $earlierAge = $this->computeProjectedRetirementAge($plan, $portfolioValue, $higherContrib);
            if ($earlierAge < $projAge) {
                $diff = $projAge - $earlierAge;
                $actions[] = "Aumentar la contribución mensual a {$this->fmtCOP($higherContrib)} (+10%) te permitiría retirarte {$diff} año(s) antes, a los {$earlierAge}.";
            }
            $actions[] = "Considera diversificar parte del portafolio en activos con mayor rendimiento (CDTs > " . number_format((float)$plan->expected_portfolio_return_rate * 100, 1) . "% EA) para mejorar la proyección sin mayor riesgo.";
            if ($plan->life_expectancy < 90) {
                $actions[] = "Con esperanza de vida hasta los 90 años, el corpus requerido sería " . $this->fmtCOP($this->computeRequiredCorpus($this->clonePlanWith($plan, ['life_expectancy' => 90]))['nominal']) . ". Considera si tu plan cubre ese escenario.";
            }
        } else {
            $deficit   = abs($surplus);
            $yearsLate = max(0, $projAge - $targetAge);
            $increase  = max(0, $reqContrib - $current);

            if ($yearsLate > 0) {
                $actions[] = "A tu ritmo actual te retirarías a los {$projAge}, {$yearsLate} año(s) después de tu meta de {$targetAge}.";
            }

            if ($increase > 0) {
                $actions[] = "Para jubilarte a los {$targetAge}, necesitas aumentar la contribución mensual a {$this->fmtCOP($reqContrib)} (+" . $this->fmtCOP($increase) . "/mes más de lo actual).";
            }

            // Required return rate to close gap
            $reqRate = $this->findRequiredReturnRate($plan, $portfolioValue);
            if ($reqRate > (float) $plan->expected_portfolio_return_rate + 0.005) {
                $actions[] = "Alternativamente, necesitarías un rendimiento del " . number_format($reqRate * 100, 1) . "% EA (actualmente proyectas " . number_format((float)$plan->expected_portfolio_return_rate * 100, 1) . "% EA) manteniendo la misma contribución.";
            }

            if ($yearsLate > 5) {
                $actions[] = "La brecha es crítica (" . $this->fmtCOP($deficit) . "). Considera fuentes adicionales: arrendamiento, dividendos, o ingresos del agro.";
            }

            $actions[] = "Si no realizas cambios, la brecha al retiro será de " . $this->fmtCOP($deficit) . " (" . number_format(($deficit / $required) * 100, 1) . "% del objetivo). El interés compuesto favorece actuar hoy.";
        }

        return array_slice($actions, 0, 5);
    }

    private function findRequiredReturnRate(RetirementPlan $plan, float $portfolioValue): float
    {
        $corpus  = $this->computeRequiredCorpus($plan)['nominal'];
        $months  = $plan->years_to_retirement * 12;
        $contrib = $plan->total_monthly_contribution;

        // Binary search between 0% and 30% EA
        $lo = 0.0;
        $hi = 0.30;
        for ($i = 0; $i < 50; $i++) {
            $mid = ($lo + $hi) / 2;
            $fv  = $this->futureValue($portfolioValue, $contrib, $this->mr($mid), $months);
            if ($fv < $corpus) {
                $lo = $mid;
            } else {
                $hi = $mid;
            }
        }
        return round(($lo + $hi) / 2, 4);
    }

    private function clonePlanWith(RetirementPlan $plan, array $overrides): RetirementPlan
    {
        $clone = new RetirementPlan($plan->toArray());
        foreach ($overrides as $key => $value) {
            $clone->$key = $value;
        }
        return $clone;
    }

    private function fmtCOP(float $v): string
    {
        return '$ ' . number_format(max(0, $v), 0, ',', '.');
    }
}
