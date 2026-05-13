<?php

namespace App\Http\Controllers;

use App\Http\Requests\Asset\StoreAssetMovementRequest;
use App\Models\AssetMovement;
use App\Services\AssetBalanceService;
use Illuminate\Http\RedirectResponse;

class AssetMovementController extends Controller
{
    public function __construct(private readonly AssetBalanceService $service) {}

    public function store(StoreAssetMovementRequest $request): RedirectResponse
    {
        $movement = AssetMovement::create($request->validated());
        $this->service->refreshCache($movement->asset);

        return back()->with('success', 'Movimiento registrado.');
    }

    public function destroy(AssetMovement $assetMovement): RedirectResponse
    {
        $asset = $assetMovement->asset;
        $assetMovement->delete();
        $this->service->refreshCache($asset);

        return back()->with('success', 'Movimiento eliminado.');
    }
}
