<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Services\AssetBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ProjectionController extends Controller
{
    public function __construct(private readonly AssetBalanceService $service) {}

    public function __invoke(Request $request): Response|JsonResponse
    {
        $assets = Asset::orderBy('name')->get();

        if ($request->wantsJson()) {
            $toDate = $request->query('to_date')
                ? Carbon::parse($request->query('to_date'))
                : Carbon::today()->addYear();

            $points = (int) ($request->query('points', 60));

            $data = $this->service->portfolioProjection($assets, $toDate, $points);

            return response()->json($data);
        }

        return Inertia::render('Projections/Index', [
            'assets' => $assets->map(fn (Asset $a) => [
                'id'   => $a->id,
                'name' => $a->name,
                'type' => $a->type,
            ])->values(),
        ]);
    }
}
