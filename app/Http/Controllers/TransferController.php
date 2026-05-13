<?php

namespace App\Http\Controllers;

use App\Http\Requests\Transfer\StoreTransferRequest;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;

class TransferController extends Controller
{
    public function store(StoreTransferRequest $request): RedirectResponse
    {
        Transfer::create($request->validated());

        return back()->with('success', 'Transferencia registrada.');
    }

    public function destroy(Transfer $transfer): RedirectResponse
    {
        $transfer->delete();

        return back()->with('success', 'Transferencia eliminada.');
    }
}
