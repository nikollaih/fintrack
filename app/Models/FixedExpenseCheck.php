<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class FixedExpenseCheck extends Model
{
    use BelongsToTenant;
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'fixed_expense_id',
        'transaction_id',
        'month',
        'year',
        'is_paid',
        'paid_at',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'is_paid' => 'boolean',
        'paid_at' => 'datetime',
    ];

    public function fixedExpense(): BelongsTo
    {
        return $this->belongsTo(FixedExpense::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
