<?php

namespace Call\Telephony\Database\Factories;

use App\Models\Team;
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
}
