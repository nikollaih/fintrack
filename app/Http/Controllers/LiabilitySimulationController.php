<?php

namespace App\Http\Controllers;

use App\Http\Requests\Liability\StoreSimulationRequest;
use App\Models\Liability;
use App\Models\LiabilitySimulation;
use App\Services\LiabilityAmortizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LiabilitySimulationController extends Controller
{
    public function __construct(private readonly LiabilityAmortizationService $service) {}

    /** Real-time preview (no persistence) used by the simulator panel. */
    public function preview(Request $request, Liability $liability): JsonResponse
    {
        $request->validate([
            'extra_monthly_payment' => 'required|numeric|min:0',
            'lump_sum_amount'       => 'nullable|numeric|min:0',
            'lump_sum_date'         => 'nullable|date',
        ]);

        $lumpSumDate = $request->lump_sum_date ? Carbon::parse($request->lump_sum_date) : null;

        $result = $this->service->simulateExtraPayment(
            $liability,
            (float) $request->extra_monthly_payment,
            $request->lump_sum_amount ? (float) $request->lump_sum_amount : null,
            $lumpSumDate,
        );

        return response()->json($result);
    }

    public function store(StoreSimulationRequest $request, Liability $liability): RedirectResponse
    {
        $data        = $request->validated();
        $lumpSumDate = isset($data['lump_sum_date']) ? Carbon::parse($data['lump_sum_date']) : null;

        $result = $this->service->simulateExtraPayment(
            $liability,
            (float) $data['extra_monthly_payment'],
            isset($data['lump_sum_amount']) ? (float) $data['lump_sum_amount'] : null,
            $lumpSumDate,
        );

        LiabilitySimulation::create([
            'liability_id'            => $liability->id,
            'name'                    => $data['name'],
            'extra_monthly_payment'   => $data['extra_monthly_payment'],
            'lump_sum_amount'         => $data['lump_sum_amount'] ?? null,
            'lump_sum_date'           => $data['lump_sum_date'] ?? null,
            'resulting_payoff_date'   => $result['new_payoff_date'],
            'resulting_total_interest' => $result['total_interest_new'],
            'resulting_months_saved'  => $result['months_saved'],
            'created_at'              => now(),
        ]);

        return back()->with('success', 'Simulación guardada.');
    }

    public function destroy(Liability $liability, LiabilitySimulation $simulation): RedirectResponse
    {
        $simulation->delete();

        return back()->with('success', 'Simulación eliminada.');
    }
}
