<?php

namespace Call\Telephony\Database\Factories;

use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Models\Agent;
use Call\Telephony\Models\AgentKnowledgeSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<AgentKnowledgeSource> */
class AgentKnowledgeSourceFactory extends Factory
{
    protected $model = AgentKnowledgeSource::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'agent_id' => Agent::factory(),
            'type' => KnowledgeSourceType::Text,
            'title' => fake()->sentence(3),
            'url' => null,
            'content' => fake()->paragraph(),
            'storage_path' => null,
            'original_filename' => null,
            'mime_type' => null,
            'file_size' => null,
            'status' => KnowledgeSourceStatus::Pending,
            'error_message' => null,
        ];
    }
}
