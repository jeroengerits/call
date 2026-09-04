<?php

namespace Call\Telephony\Models;

use Call\Telephony\Database\Factories\AgentFactory;
use Call\Telephony\Enums\Language;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'team_id',
    'name',
    'language',
    'greeting',
    'instructions',
    'knowledge',
    'is_active',
])]
class Agent extends Model
{
    /** @use HasFactory<AgentFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::deleting(function (Agent $agent): void {
            $disk = Storage::disk((string) config('filesystems.knowledge_disk'));
            $agent->knowledgeSources()->get()->each(function (AgentKnowledgeSource $source) use ($disk): void {
                if ($source->storage_path !== null) {
                    $disk->delete($source->storage_path);
                }
            });
        });
    }

    protected static function newFactory(): Factory
    {
        return AgentFactory::new();
    }

    /** @return BelongsTo<Model, $this> */
    public function team(): BelongsTo
    {
        return $this->belongsTo(config('telephony.team_model'));
    }

    /** @return HasMany<PhoneNumber, $this> */
    public function phoneNumbers(): HasMany
    {
        return $this->hasMany(PhoneNumber::class);
    }

    /** @return HasMany<Call, $this> */
    public function calls(): HasMany
    {
        return $this->hasMany(Call::class);
    }

    /** @return HasMany<AgentKnowledgeSource, $this> */
    public function knowledgeSources(): HasMany
    {
        return $this->hasMany(AgentKnowledgeSource::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'language' => Language::class,
            'is_active' => 'boolean',
        ];
    }
}
