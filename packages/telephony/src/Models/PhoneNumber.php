<?php

namespace Call\Telephony\Models;

use Call\Telephony\Database\Factories\PhoneNumberFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['team_id', 'agent_id', 'number', 'is_active'])]
class PhoneNumber extends Model
{
    /** @use HasFactory<PhoneNumberFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return PhoneNumberFactory::new();
    }

    /** @return BelongsTo<Model, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(config('telephony.team_model'));
    }

    /** @return BelongsTo<Agent, $this> */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /** @return HasMany<Call, $this> */
    public function calls(): HasMany
    {
        return $this->hasMany(Call::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
