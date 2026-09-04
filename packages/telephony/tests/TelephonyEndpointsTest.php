<?php

namespace Call\Telephony\Tests;

use App\Models\Team;
use App\Models\User;
use Call\Telephony\Models\Agent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TelephonyEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_dashboard_contains_team_telephony_data(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->get(route('dashboard', $team))
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('telephony.agents', 1)
                ->has('telephony.phoneNumbers', 0)
                ->has('telephony.calls', 0)
                ->where('telephony.agents.0.name', $agent->name),
            );
    }

    public function test_a_team_member_can_create_an_agent(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $response = $this->actingAs($user)->post(route('agents.store', $team), [
            'name' => 'Reception',
            'language' => 'en-US',
            'greeting' => 'Hello',
            'instructions' => 'Be concise',
            'knowledge' => 'Opening hours are 9 to 5.',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('agents', [
            'team_id' => $team->id,
            'name' => 'Reception',
        ]);
    }

    public function test_a_team_member_can_assign_a_phone_number_to_a_team_agent(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $response = $this->actingAs($user)->post(route('phone-numbers.store', $team), [
            'agent_id' => $agent->id,
            'number' => '+15550101234',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('phone_numbers', [
            'team_id' => $team->id,
            'agent_id' => $agent->id,
            'number' => '+15550101234',
        ]);
    }

    public function test_a_phone_number_cannot_be_assigned_to_an_agent_from_another_team(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $otherTeam = Team::factory()->create();
        $otherAgent = Agent::factory()->for($otherTeam)->create();

        $this->actingAs($user)
            ->post(route('phone-numbers.store', $team), [
                'agent_id' => $otherAgent->id,
                'number' => '+15550101234',
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('phone_numbers', [
            'number' => '+15550101234',
        ]);
    }

    public function test_agent_creation_requires_core_configuration(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('agents.store', $user->currentTeam), [])
            ->assertSessionHasErrors(['name', 'language']);
    }

    public function test_agent_creation_rejects_languages_outside_the_supported_enum(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('agents.store', $user->currentTeam), [
                'name' => 'Reception',
                'language' => 'xx-XX',
            ])
            ->assertSessionHasErrors(['language']);
    }
}
