<?php

namespace App\Http\Controllers;

use App\Http\Requests\Transaction\StoreTransactionRequest;
use App\Http\Requests\Transaction\UpdateTransactionRequest;
use App\Http\Resources\AccountResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TransactionResource;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Transfer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Transaction::with(['account', 'categoryModel'])->orderByDesc('date');

        if ($request->filled('month')) {
            [$year, $month] = explode('-', $request->month);
            $query->whereYear('date', $year)->whereMonth('date', $month);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        $transactions = $query->get();

        $monthlySummary = Transaction::selectRaw(
            "to_char(date, 'YYYY-MM') as month,
             SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
             SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses"
        )
            ->groupByRaw("to_char(date, 'YYYY-MM')")
            ->orderByRaw("to_char(date, 'YYYY-MM') ASC")
            ->limit(12)
            ->get();

        return Inertia::render('Transactions/Index', [
            'transactions' => TransactionResource::collection($transactions),
            'monthly_summary' => $monthlySummary,
            'accounts' => AccountResource::collection(Account::where('is_active', true)->orderBy('name')->get()),
            'categories' => CategoryResource::collection(
                Category::whereIn('type', ['expense', 'income', 'both'])
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
            ),
            'filters' => $request->only(['month', 'type', 'category_id', 'account_id']),
        ]);
    }

    public function store(StoreTransactionRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        Transaction::create($validated);

        $response = back()->with('success', 'Transacción creada.');

        // Detect potential double-counting: expense on a non-CC account while a same-day
        // same-amount transfer from that account to any credit card also exists.
        if (
            ($validated['type'] ?? '') === 'expense' &&
            ! empty($validated['account_id'])
        ) {
            $account = Account::find($validated['account_id']);

            if ($account && ! $account->isCreditCard()) {
                $doubleCount = Transfer::where('from_account_id', $validated['account_id'])
                    ->whereHas('toAccount', fn ($q) => $q->where('type', 'credit_card'))
                    ->whereDate('date', $validated['date'])
                    ->where('amount', $validated['amount'])
                    ->exists();

                if ($doubleCount) {
                    return $response->with(
                        'warning',
                        '⚠️ Hay una transferencia a una tarjeta de crédito por el mismo monto en la misma fecha. '
                        . 'Si estás registrando el pago de una TC como gasto, estarías contabilizando ese dinero dos veces. '
                        . 'El pago de TC debe hacerse como Transferencia, no como gasto.'
                    );
                }
            }
        }

        return $response;
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): RedirectResponse
    {
        $transaction->update($request->validated());

        return back()->with('success', 'Transacción actualizada.');
    }

    public function destroy(Transaction $transaction): RedirectResponse
    {
        $transaction->delete();

        return back()->with('success', 'Transacción eliminada.');
    }
}
