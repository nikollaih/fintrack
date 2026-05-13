<?php

namespace App\Http\Controllers;

use App\Http\Requests\CropExpense\StoreCropExpenseRequest;
use App\Http\Resources\CropExpenseResource;
use App\Models\CropExpense;
use Illuminate\Http\RedirectResponse;

class CropExpenseController extends Controller
{
    public function store(StoreCropExpenseRequest $request): RedirectResponse
    {
        CropExpense::create($request->validated());

        return back()->with('success', 'Expense added.');
    }

    public function destroy(CropExpense $cropExpense): RedirectResponse
    {
        $cropExpense->delete();

        return back()->with('success', 'Expense deleted.');
    }
}
