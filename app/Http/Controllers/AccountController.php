<?php

namespace App\Http\Controllers;

use App\Http\Requests\Account\StoreAccountRequest;
use App\Http\Requests\Account\UpdateAccountRequest;
use App\Http\Resources\AccountResource;
use App\Http\Resources\TransactionResource;
use App\Http\Resources\TransferResource;
use App\Models\Account;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Accounts/Index', [
            'accounts' => AccountResource::collection(
                Account::orderBy('name')->get()
            ),
        ]);
    }

    public function show(Account $account): Response
    {
        $transactions = $account->transactions()
            ->orderByDesc('date')
            ->get();

        $transfers = Transfer::where(function ($q) use ($account): void {
            $q->where('from_account_id', $account->id)
              ->orWhere('to_account_id', $account->id);
        })
            ->with(['fromAccount', 'toAccount'])
            ->orderByDesc('date')
            ->get();

        return Inertia::render('Accounts/Show', [
            'account' => new AccountResource($account),
            'transactions' => TransactionResource::collection($transactions),
            'transfers' => TransferResource::collection($transfers),
        ]);
    }

    public function store(StoreAccountRequest $request): RedirectResponse
    {
        Account::create($request->validated());

        return back()->with('success', 'Cuenta creada.');
    }

    public function update(UpdateAccountRequest $request, Account $account): RedirectResponse
    {
        $account->update($request->validated());

        return back()->with('success', 'Cuenta actualizada.');
    }

    public function destroy(Account $account): RedirectResponse
    {
        $account->delete();

        return back()->with('success', 'Cuenta eliminada.');
    }
}
