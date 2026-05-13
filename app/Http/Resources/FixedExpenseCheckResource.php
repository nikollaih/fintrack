<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FixedExpenseCheckResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fixed_expense_id' => $this->fixed_expense_id,
            'transaction_id' => $this->transaction_id,
            'month' => $this->month,
            'year' => $this->year,
            'is_paid' => $this->is_paid,
            'paid_at' => $this->paid_at?->toISOString(),
        ];
    }
}
