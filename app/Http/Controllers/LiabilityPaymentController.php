<?php

namespace App\Http\Controllers;

use App\Http\Requests\Liability\StorePaymentRequest;
use App\Models\Category;
use App\Models\Liability;
use App\Models\LiabilityPayment;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;

class LiabilityPaymentController extends Controller
{
    public function store(StorePaymentRequest $request, Liability $liability): RedirectResponse
    {
        $data = $request->validated();

        $transactionId = null;

        // Optionally create a linked transaction
        if ($request->boolean('create_transaction') && $liability->linked_account_id) {
            $category = Category::where('name', 'like', '%deuda%')
                ->orWhere('name', 'like', '%crédito%')
                ->orWhere('name', 'like', '%préstamo%')
                ->first();

            $transaction = Transaction::create([
                'account_id'  => $liability->linked_account_id,
                'type'        => 'expense',
                'amount'      => $data['total_paid'],
                'description' => 'Pago ' . $liability->name,
                'date'        => $data['payment_date'],
                'category_id' => $category?->id,
                'category_text' => $category ? null : 'Pago de deuda',
            ]);

            $transactionId = $transaction->id;
        }

        LiabilityPayment::create([
            'liability_id'             => $liability->id,
            'payment_date'             => $data['payment_date'],
            'total_paid'               => $data['total_paid'],
            'principal_paid'           => $data['principal_paid'],
            'interest_paid'            => $data['interest_paid'],
            'outstanding_balance_after' => $data['outstanding_balance_after'],
            'transaction_id'           => $transactionId,
            'payment_type'             => $data['payment_type'],
            'payment_number'           => $data['payment_number'] ?? null,
            'notes'                    => $data['notes'] ?? null,
        ]);

        // Keep outstanding_balance field in sync with latest payment
        $liability->update(['outstanding_balance' => $data['outstanding_balance_after']]);

        return back()->with('success', 'Pago registrado exitosamente.');
    }

    public function destroy(Liability $liability, LiabilityPayment $payment): RedirectResponse
    {
        // Restore outstanding_balance to previous payment or original amount
        $previousPayment = $liability->payments()
            ->where('id', '!=', $payment->id)
            ->orderByDesc('payment_date')
            ->first();

        $restoredBalance = $previousPayment
            ? (float) $previousPayment->outstanding_balance_after
            : (float) $liability->original_amount;

        $payment->delete();
        $liability->update(['outstanding_balance' => $restoredBalance]);

        return back()->with('success', 'Pago eliminado.');
    }
}
