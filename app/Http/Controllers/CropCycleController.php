<?php

namespace App\Http\Controllers;

use App\Http\Requests\CropCycle\StoreCropCycleRequest;
use App\Http\Requests\CropCycle\UpdateCropCycleRequest;
use App\Http\Resources\BuyerResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\CropCycleResource;
use App\Http\Resources\SupplierResource;
use App\Models\Buyer;
use App\Models\Category;
use App\Models\CropCycle;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CropCycleController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Agro/Cycles/Index', [
            'cycles' => CropCycleResource::collection(
                CropCycle::withCount(['expenses', 'sales'])->orderByDesc('sown_at')->get()
            ),
        ]);
    }

    public function show(CropCycle $cropCycle): Response
    {
        $cropCycle->load(['expenses.supplier', 'expenses.categoryModel', 'sales.buyer']);

        return Inertia::render('Agro/Cycles/Show', [
            'cycle' => new CropCycleResource($cropCycle),
            'suppliers' => SupplierResource::collection(Supplier::orderBy('name')->get()),
            'buyers' => BuyerResource::collection(Buyer::orderBy('name')->get()),
            'agro_categories' => CategoryResource::collection(
                Category::where('type', 'agro')
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
            ),
        ]);
    }

    public function store(StoreCropCycleRequest $request): RedirectResponse
    {
        CropCycle::create($request->validated());

        return back()->with('success', 'Ciclo de cultivo creado.');
    }

    public function update(UpdateCropCycleRequest $request, CropCycle $cropCycle): RedirectResponse
    {
        $cropCycle->update($request->validated());

        return back()->with('success', 'Ciclo de cultivo actualizado.');
    }

    public function destroy(CropCycle $cropCycle): RedirectResponse
    {
        $cropCycle->delete();

        return back()->with('success', 'Ciclo de cultivo eliminado.');
    }
}
