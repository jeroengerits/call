<?php

namespace Call\Telephony\Models;

use Call\Telephony\Database\Factories\AgentKnowledgeSourceFactory;
use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Enums\KnowledgeSourceType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'agent_id',
    'type',
    'title',
    'url',
    'content',
    'storage_path',
    'original_filename',
    'mime_type',
    'file_size',
    'status',
    'error_message',
])]
class AgentKnowledgeSource extends Model
{
    /** @use HasFactory<AgentKnowledgeSourceFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return AgentKnowledgeSourceFactory::new();
    }

    /** @return BelongsTo<Agent, $this> */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => KnowledgeSourceType::class,
            'status' => KnowledgeSourceStatus::class,
            'file_size' => 'integer',
        ];
    }
}
