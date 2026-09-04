<?php

namespace Call\Telephony\Models;

use Call\Telephony\Database\Factories\CallFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'team_id',
    'agent_id',
    'phone_number_id',
    'twilio_call_sid',
    'caller_number',
    'status',
    'messages',
    'summary',
    'outcome',
    'started_at',
    'ended_at',
])]
class Call extends Model
{
    /** @use HasFactory<CallFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return CallFactory::new();
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

    /** @return BelongsTo<PhoneNumber, $this> */
    public function phoneNumber(): BelongsTo
    {
        return $this->belongsTo(PhoneNumber::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'messages' => 'array',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }
}
