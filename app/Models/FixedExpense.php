<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class FixedExpense extends Model
{
    use BelongsToTenant;
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'amount',
        'category',
        'category_id',
        'payment_method',
        'expected_day',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'expected_day' => 'integer',
        'is_active' => 'boolean',
    ];

    public function checks(): HasMany
    {
        return $this->hasMany(FixedExpenseCheck::class);
    }

    public function categoryModel(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
