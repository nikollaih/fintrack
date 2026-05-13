<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiabilityPayment extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'tenant_id',
        'liability_id',
        'payment_date',
        'total_paid',
        'principal_paid',
        'interest_paid',
        'outstanding_balance_after',
        'transaction_id',
        'payment_type',
        'payment_number',
        'notes',
    ];

    protected $casts = [
        'total_paid'                => 'decimal:4',
        'principal_paid'            => 'decimal:4',
        'interest_paid'             => 'decimal:4',
        'outstanding_balance_after' => 'decimal:4',
        'payment_date'              => 'date',
        'payment_number'            => 'integer',
    ];

    public function liability(): BelongsTo
    {
        return $this->belongsTo(Liability::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
