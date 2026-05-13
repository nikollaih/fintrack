<?php

namespace App\Http\Controllers;

use App\Http\Requests\CropSale\StoreCropSaleRequest;
use App\Models\CropSale;
use Illuminate\Http\RedirectResponse;

class CropSaleController extends Controller
{
    public function store(StoreCropSaleRequest $request): RedirectResponse
    {
        CropSale::create($request->validated());

        return back()->with('success', 'Sale added.');
    }

    public function destroy(CropSale $cropSale): RedirectResponse
    {
        $cropSale->delete();

        return back()->with('success', 'Sale deleted.');
    }
}
