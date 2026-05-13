<?php

namespace App\Http\Controllers;

use App\Http\Requests\FixedExpense\StoreFixedExpenseRequest;
use App\Http\Requests\FixedExpense\UpdateFixedExpenseRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\FixedExpenseCheckResource;
use App\Http\Resources\FixedExpenseResource;
use App\Models\Category;
use App\Models\FixedExpense;
use App\Models\FixedExpenseCheck;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class FixedExpenseController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now();
        $month = $now->month;
        $year = $now->year;

        $expenses = FixedExpense::where('is_active', true)
            ->orderBy('expected_day')
            ->get();

        foreach ($expenses as $expense) {
            FixedExpenseCheck::firstOrCreate(
                ['fixed_expense_id' => $expense->id, 'month' => $month, 'year' => $year],
                ['tenant_id' => $expense->tenant_id, 'is_paid' => false]
            );
        }

        $expenses->load([
            'categoryModel',
            'checks' => fn ($q) => $q->where('month', $month)->where('year', $year),
        ]);

        return Inertia::render('FixedExpenses/Index', [
            'expenses' => FixedExpenseResource::collection($expenses),
            'categories' => CategoryResource::collection(
                Category::whereIn('type', ['expense', 'both'])
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get()
            ),
            'month' => $month,
            'year' => $year,
        ]);
    }

    public function store(StoreFixedExpenseRequest $request): RedirectResponse
    {
        FixedExpense::create($request->validated());

        return back()->with('success', 'Gasto fijo creado.');
    }

    public function update(UpdateFixedExpenseRequest $request, FixedExpense $fixedExpense): RedirectResponse
    {
        $fixedExpense->update($request->validated());

        return back()->with('success', 'Gasto fijo actualizado.');
    }

    public function destroy(FixedExpense $fixedExpense): RedirectResponse
    {
        $fixedExpense->delete();

        return back()->with('success', 'Gasto fijo eliminado.');
    }

    public function toggle(FixedExpense $fixedExpense): JsonResponse
    {
        $now = Carbon::now();
        $check = FixedExpenseCheck::where('fixed_expense_id', $fixedExpense->id)
            ->where('month', $now->month)
            ->where('year', $now->year)
            ->firstOrFail();

        $newIsPaid = ! $check->is_paid;
        $check->update([
            'is_paid' => $newIsPaid,
            'paid_at' => $newIsPaid ? now() : null,
        ]);

        return response()->json(['check' => new FixedExpenseCheckResource($check->fresh())]);
    }

    public function pay(FixedExpense $fixedExpense): JsonResponse
    {
        $now = Carbon::now();
        $check = FixedExpenseCheck::where('fixed_expense_id', $fixedExpense->id)
            ->where('month', $now->month)
            ->where('year', $now->year)
            ->firstOrFail();

        if ($check->transaction_id) {
            return response()->json(['check' => new FixedExpenseCheckResource($check)]);
        }

        $transaction = Transaction::create([
            'type' => 'expense',
            'amount' => $fixedExpense->amount,
            'category_id' => $fixedExpense->category_id,
            'category' => null,
            'description' => "Gasto fijo: {$fixedExpense->name}",
            'date' => $now->toDateString(),
            'payment_method' => $fixedExpense->payment_method,
            'cashback_rate' => 0,
        ]);

        $check->update([
            'is_paid' => true,
            'paid_at' => now(),
            'transaction_id' => $transaction->id,
        ]);

        return response()->json(['check' => new FixedExpenseCheckResource($check->fresh())]);
    }
}
