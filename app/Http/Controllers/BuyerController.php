<?php

namespace App\Http\Controllers;

use App\Http\Requests\Buyer\StoreBuyerRequest;
use App\Http\Requests\Buyer\UpdateBuyerRequest;
use App\Http\Resources\BuyerResource;
use App\Models\Buyer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BuyerController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Buyer::orderBy('name');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return Inertia::render('Agro/Buyers/Index', [
            'buyers' => BuyerResource::collection($query->get()),
            'filters' => $request->only('type'),
        ]);
    }

    public function store(StoreBuyerRequest $request): RedirectResponse
    {
        Buyer::create($request->validated());

        return back()->with('success', 'Buyer created.');
    }

    public function update(UpdateBuyerRequest $request, Buyer $buyer): RedirectResponse
    {
        $buyer->update($request->validated());

        return back()->with('success', 'Buyer updated.');
    }

    public function destroy(Buyer $buyer): RedirectResponse
    {
        $buyer->delete();

        return back()->with('success', 'Buyer deleted.');
    }
}
