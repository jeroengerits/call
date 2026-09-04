<?php

namespace Call\Telephony\Database\Factories;

use App\Models\Team;
use Call\Telephony\Models\Agent;
use Call\Telephony\Models\Call;
use Call\Telephony\Models\PhoneNumber;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Call> */
class CallFactory extends Factory
{
    protected $model = Call::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'agent_id' => null,
            'phone_number_id' => null,
            'twilio_call_sid' => 'CA'.fake()->unique()->bothify('##############################'),
            'caller_number' => fake()->numerify('+1555#######'),
            'status' => 'completed',
            'messages' => [],
            'summary' => null,
            'outcome' => null,
            'started_at' => now(),
            'ended_at' => now(),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Call $call): void {
            if ($call->agent_id === null) {
                $call->agent_id = Agent::factory()->create([
                    'team_id' => $call->team_id,
                ])->id;
            }

            if ($call->phone_number_id === null) {
                $call->phone_number_id = PhoneNumber::factory()->create([
                    'team_id' => $call->team_id,
                    'agent_id' => $call->agent_id,
                ])->id;
            }
        });
    }
}
