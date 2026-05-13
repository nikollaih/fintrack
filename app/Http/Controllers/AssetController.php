<?php

namespace App\Http\Controllers;

use App\Http\Requests\Asset\StoreAssetRequest;
use App\Http\Requests\Asset\UpdateAssetRequest;
use App\Http\Resources\AssetMovementResource;
use App\Models\Asset;
use App\Models\AssetMovement;
use App\Services\AssetBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function __construct(private readonly AssetBalanceService $service) {}

    public function index(): Response
    {
        $assets = Asset::with('balanceCache')->orderBy('name')->get();
        $today  = Carbon::today();

        $totalBalance = 0.0;

        $assetsData = $assets->map(function (Asset $asset) use ($today, &$totalBalance): array {
            $computed = $this->service->getCachedOrCompute($asset);

            // Interest this month
            $monthStart          = $today->copy()->startOfMonth();
            $balanceAtMonthStart = $this->service->computeAt($asset, $monthStart);
            $movThisMonth        = $this->movementsThisMonth($asset, $monthStart, $today);
            $interestThisMonth   = max(0.0, $computed['balance'] - $balanceAtMonthStart['balance'] - $movThisMonth);

            // Maturity value
            $maturityValue = null;
            if ($asset->maturity_date) {
                $m             = $this->service->computeAt($asset, Carbon::parse($asset->maturity_date));
                $maturityValue = $m['balance'];
            }

            $totalBalance += $computed['balance'];

            return [
                'id'                    => $asset->id,
                'type'                  => $asset->type,
                'name'                  => $asset->name,
                'initial_balance'       => (float) $asset->initial_balance,
                'start_date'            => $asset->start_date->toDateString(),
                'rate_ea'               => $asset->rate_ea ? (float) $asset->rate_ea : null,
                'compounding_frequency' => $asset->compounding_frequency,
                'maturity_date'         => $asset->maturity_date?->toDateString(),
                'notes'                 => $asset->notes,
                'balance'               => $computed['balance'],
                'interest_earned'       => $computed['interest_earned'],
                'interest_this_month'   => $interestThisMonth,
                'maturity_value'        => $maturityValue,
                'days_to_maturity'      => $asset->maturity_date
                    ? max(0, (int) $today->diffInDays(Carbon::parse($asset->maturity_date), false))
                    : null,
                'created_at'            => $asset->created_at->toISOString(),
                'updated_at'            => $asset->updated_at->toISOString(),
            ];
        });

        return Inertia::render('Assets/Index', [
            'assets'        => $assetsData->values(),
            'total_balance' => $totalBalance,
        ]);
    }

    public function show(Asset $asset): Response
    {
        $today    = Carbon::today();
        $computed = $this->service->computeAt($asset, $today);

        $monthStart          = $today->copy()->startOfMonth();
        $balanceAtMonthStart = $this->service->computeAt($asset, $monthStart);
        $movThisMonth        = $this->movementsThisMonth($asset, $monthStart, $today);
        $interestThisMonth   = max(0.0, $computed['balance'] - $balanceAtMonthStart['balance'] - $movThisMonth);

        $maturityValue  = null;
        $daysToMaturity = null;
        if ($asset->maturity_date) {
            $m              = $this->service->computeAt($asset, Carbon::parse($asset->maturity_date));
            $maturityValue  = $m['balance'];
            $daysToMaturity = max(0, (int) $today->diffInDays(Carbon::parse($asset->maturity_date), false));
        }

        $movements = $asset->movements()->get();
        $timeline  = $this->service->buildTimeline($asset, $movements, $today);

        $assetData = [
            'id'                    => $asset->id,
            'type'                  => $asset->type,
            'name'                  => $asset->name,
            'initial_balance'       => (float) $asset->initial_balance,
            'start_date'            => $asset->start_date->toDateString(),
            'rate_ea'               => $asset->rate_ea ? (float) $asset->rate_ea : null,
            'compounding_frequency' => $asset->compounding_frequency,
            'maturity_date'         => $asset->maturity_date?->toDateString(),
            'notes'                 => $asset->notes,
            'balance'               => $computed['balance'],
            'interest_earned'       => $computed['interest_earned'],
            'interest_this_month'   => $interestThisMonth,
            'maturity_value'        => $maturityValue,
            'days_to_maturity'      => $daysToMaturity,
            'created_at'            => $asset->created_at->toISOString(),
            'updated_at'            => $asset->updated_at->toISOString(),
        ];

        return Inertia::render('Assets/Show', [
            'asset'     => $assetData,
            'computed'  => [
                'balance'             => $computed['balance'],
                'interest_earned'     => $computed['interest_earned'],
                'interest_this_month' => $interestThisMonth,
                'principal'           => $computed['principal'],
                'maturity_value'      => $maturityValue,
                'days_to_maturity'    => $daysToMaturity,
            ],
            'movements' => AssetMovementResource::collection($movements),
            'timeline'  => $timeline,
        ]);
    }

    public function store(StoreAssetRequest $request): RedirectResponse
    {
        $asset = Asset::create($request->validated());
        $this->service->refreshCache($asset);

        return back()->with('success', 'Activo creado exitosamente.');
    }

    public function update(UpdateAssetRequest $request, Asset $asset): RedirectResponse
    {
        $asset->update($request->validated());
        $this->service->refreshCache($asset);

        return back()->with('success', 'Activo actualizado.');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        $asset->delete();

        return back()->with('success', 'Activo eliminado.');
    }

    public function projection(Request $request, Asset $asset): JsonResponse
    {
        $toDate = $request->query('to_date')
            ? Carbon::parse($request->query('to_date'))
            : Carbon::today()->addYear();

        $points = min(120, max(20, (int) ($request->query('points', 60))));

        $data = $this->service->computeProjection($asset, $toDate, $points);

        return response()->json($data);
    }

    private function movementsThisMonth(Asset $asset, Carbon $from, Carbon $to): float
    {
        return (float) AssetMovement::where('asset_id', $asset->id)
            ->whereDate('date', '>=', $from->toDateString())
            ->whereDate('date', '<=', $to->toDateString())
            ->sum('amount');
    }
}
