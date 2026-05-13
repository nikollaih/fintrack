<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'type',
        'currency',
        'initial_balance',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'initial_balance' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'to_account_id');
    }

    public function outgoingTransfers(): HasMany
    {
        return $this->hasMany(Transfer::class, 'from_account_id');
    }

    public function isCreditCard(): bool
    {
        return $this->type === 'credit_card';
    }

    /**
     * Compute live balance from transaction and transfer history.
     * For credit cards, the balance represents current debt.
     */
    public function computeBalance(): float
    {
        $income = (float) $this->transactions()->where('type', 'income')->sum('amount');
        $expenses = (float) $this->transactions()->where('type', 'expense')->sum('amount');
        $incoming = (float) $this->incomingTransfers()->sum('amount');
        $outgoing = (float) $this->outgoingTransfers()->sum('amount');
        $initial = (float) $this->initial_balance;

        if ($this->isCreditCard()) {
            // Debt: expenses increase it, payments/incoming transfers reduce it
            return $initial + $expenses - $income - $incoming + $outgoing;
        }

        return $initial + $income - $expenses + $incoming - $outgoing;
    }
}
