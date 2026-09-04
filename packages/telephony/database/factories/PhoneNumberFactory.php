<?php

namespace Call\Telephony\Database\Factories;

use App\Models\Team;
use Call\Telephony\Models\Agent;
use Call\Telephony\Models\PhoneNumber;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PhoneNumber> */
class PhoneNumberFactory extends Factory
{
    protected $model = PhoneNumber::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'agent_id' => null,
            'number' => fake()->unique()->numerify('+1555#######'),
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (PhoneNumber $phoneNumber): void {
            if ($phoneNumber->agent_id !== null) {
                return;
            }

            $phoneNumber->agent_id = Agent::factory()->create([
                'team_id' => $phoneNumber->team_id,
            ])->id;
        });
    }
}
