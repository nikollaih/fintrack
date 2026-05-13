<?php

namespace App\Http\Controllers;

use App\Http\Requests\Liability\StoreLiabilityRequest;
use App\Http\Requests\Liability\UpdateLiabilityRequest;
use App\Models\Account;
use App\Models\Category;
use App\Models\FixedExpense;
use App\Models\Liability;
use App\Models\RetirementPlan;
use App\Services\LiabilityAmortizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiabilityController extends Controller
{
    public function __construct(private readonly LiabilityAmortizationService $service) {}

    public function index(): Response
    {
        $liabilities = Liability::with(['payments', 'linkedAccount'])->get();
        $active      = $liabilities->where('status', 'active');

        $totals = $this->service->summaryTotals($active);

        $liabilityData = $liabilities->map(fn (Liability $l) => $this->serializeCard($l));

        $accounts = Account::where('is_active', true)->orderBy('name')
            ->get(['id', 'name', 'type']);

        return Inertia::render('Liabilities/Index', [
            'liabilities' => $liabilityData->values(),
            'totals'      => $totals,
            'accounts'    => $accounts->map(fn ($a) => ['id' => $a->id, 'name' => $a->name, 'type' => $a->type]),
        ]);
    }

    public function show(Liability $liability): Response
    {
        $liability->load(['payments', 'linkedAccount', 'simulations']);

        $schedule = $this->service->generateSchedule($liability);
        $position = $this->service->currentPosition($liability, $liability->payments);

        // For mortgage: get portfolio return rate from retirement plan
        $portfolioReturnRate = null;
        if ($liability->isMortgage()) {
            $plan = RetirementPlan::first();
            $portfolioReturnRate = $plan ? (float) $plan->expected_portfolio_return_rate : 0.12;
        }

        $accounts = Account::where('is_active', true)->orderBy('name')
            ->get(['id', 'name', 'type']);

        return Inertia::render('Liabilities/Show', [
            'liability'          => $this->serializeFull($liability),
            'schedule'           => $schedule,
            'position'           => $position,
            'payments'           => $liability->payments->map(fn ($p) => [
                'id'                     => $p->id,
                'payment_number'         => $p->payment_number,
                'payment_date'           => $p->payment_date->toDateString(),
                'total_paid'             => (float) $p->total_paid,
                'principal_paid'         => (float) $p->principal_paid,
                'interest_paid'          => (float) $p->interest_paid,
                'outstanding_balance_after' => (float) $p->outstanding_balance_after,
                'payment_type'           => $p->payment_type,
                'notes'                  => $p->notes,
            ])->values(),
            'simulations'        => $liability->simulations->map(fn ($s) => [
                'id'                     => $s->id,
                'name'                   => $s->name,
                'extra_monthly_payment'  => (float) $s->extra_monthly_payment,
                'lump_sum_amount'        => $s->lump_sum_amount ? (float) $s->lump_sum_amount : null,
                'lump_sum_date'          => $s->lump_sum_date?->toDateString(),
                'resulting_payoff_date'  => $s->resulting_payoff_date->toDateString(),
                'resulting_total_interest' => (float) $s->resulting_total_interest,
                'resulting_months_saved' => $s->resulting_months_saved,
                'created_at'             => $s->created_at->toISOString(),
            ])->values(),
            'accounts'           => $accounts->map(fn ($a) => ['id' => $a->id, 'name' => $a->name, 'type' => $a->type]),
            'portfolio_return_rate' => $portfolioReturnRate,
        ]);
    }

    public function store(StoreLiabilityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // If user did not provide monthly_payment, compute it via French formula
        if (empty($data['monthly_payment']) || $data['monthly_payment'] == 0) {
            $data['monthly_payment'] = $this->computeMonthlyPayment(
                (float) $data['original_amount'],
                (float) $data['annual_interest_rate'],
                (int) $data['term_months'],
                $data['type'],
            );
        }

        $liability = Liability::create($data);

        // Offer to auto-create fixed expense if linked account + payment_day set
        if ($request->boolean('create_fixed_expense') && $liability->linked_account_id) {
            FixedExpense::create([
                'name'           => $liability->name,
                'amount'         => $liability->monthly_payment,
                'expected_day'   => $liability->payment_day,
                'payment_method' => 'account',
                'is_active'      => true,
                'notes'          => 'Generado automáticamente desde pasivo: ' . $liability->name,
            ]);
        }

        return redirect()->route('liabilities.show', $liability)
            ->with('success', 'Pasivo creado exitosamente.');
    }

    public function update(UpdateLiabilityRequest $request, Liability $liability): RedirectResponse
    {
        $liability->update($request->validated());

        return back()->with('success', 'Pasivo actualizado.');
    }

    public function destroy(Liability $liability): RedirectResponse
    {
        $liability->delete();

        return redirect()->route('liabilities.index')
            ->with('success', 'Pasivo eliminado.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function serializeCard(Liability $l): array
    {
        $paidCount    = $l->payments->count();
        $schedule     = $this->service->generateSchedule($l);
        $remaining    = array_slice($schedule, $paidCount);
        $payoffDate   = ! empty($remaining) ? end($remaining)['date'] : null;
        $pctPaid      = (float) $l->original_amount > 0
            ? round((1 - ((float) $l->outstanding_balance / (float) $l->original_amount)) * 100, 1)
            : 100.0;

        return [
            'id'                   => $l->id,
            'name'                 => $l->name,
            'type'                 => $l->type,
            'status'               => $l->status,
            'original_amount'      => (float) $l->original_amount,
            'outstanding_balance'  => (float) $l->outstanding_balance,
            'annual_interest_rate' => (float) $l->annual_interest_rate,
            'term_months'          => $l->term_months,
            'monthly_payment'      => (float) $l->monthly_payment,
            'payment_day'          => $l->payment_day,
            'start_date'           => $l->start_date->toDateString(),
            'first_payment_date'   => $l->first_payment_date->toDateString(),
            'payments_made'        => $paidCount,
            'projected_payoff_date' => $payoffDate,
            'pct_paid'             => $pctPaid,
            'linked_account'       => $l->linkedAccount ? ['id' => $l->linkedAccount->id, 'name' => $l->linkedAccount->name] : null,
            'notes'                => $l->notes,
            'estimated_property_value' => $l->estimated_property_value ? (float) $l->estimated_property_value : null,
        ];
    }

    private function serializeFull(Liability $l): array
    {
        return array_merge($this->serializeCard($l), [
            'early_payment_penalty_rate' => $l->early_payment_penalty_rate ? (float) $l->early_payment_penalty_rate : null,
            'created_at'                 => $l->created_at->toISOString(),
        ]);
    }

    private function computeMonthlyPayment(float $principal, float $annualRate, int $termMonths, string $type): float
    {
        $r = $type === 'cooperative_loan' ? pow(1 + $annualRate, 1 / 12) - 1 : $annualRate / 12;

        if ($r == 0) {
            return round($principal / $termMonths, 4);
        }

        return round($principal * $r / (1 - pow(1 + $r, -$termMonths)), 4);
    }
}
