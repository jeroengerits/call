<?php

namespace Call\Telephony\Database\Factories;

use App\Models\Team;
use Call\Telephony\Models\Agent;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Agent> */
class AgentFactory extends Factory
{
    protected $model = Agent::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'name' => fake()->name().' Agent',
            'language' => 'en-US',
            'greeting' => 'How can I help you?',
            'instructions' => 'Be helpful and concise.',
            'knowledge' => null,
            'is_active' => true,
        ];
    }
}
