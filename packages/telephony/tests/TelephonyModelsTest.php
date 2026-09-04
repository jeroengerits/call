<?php

namespace Call\Telephony\Tests;

use App\Models\Team;
use Call\Telephony\Models\Agent;
use Call\Telephony\Models\Call as CallModel;
use Call\Telephony\Models\PhoneNumber;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TelephonyModelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_team_can_have_multiple_agents_and_phone_numbers(): void
    {
        $team = Team::factory()->create();
        $firstAgent = Agent::factory()->for($team)->create();
        $secondAgent = Agent::factory()->for($team)->create();

        $firstPhoneNumber = PhoneNumber::factory()
            ->for($team)
            ->for($firstAgent, 'agent')
            ->create();
        $secondPhoneNumber = PhoneNumber::factory()
            ->for($team)
            ->for($secondAgent, 'agent')
            ->create();

        $this->assertCount(2, $team->fresh()->agents);
        $this->assertCount(2, $team->fresh()->phoneNumbers);
        $this->assertTrue($firstAgent->fresh()->phoneNumbers->contains($firstPhoneNumber));
        $this->assertTrue($secondAgent->fresh()->phoneNumbers->contains($secondPhoneNumber));
    }

    public function test_calls_are_related_to_their_team_agent_and_phone_number(): void
    {
        $team = Team::factory()->create();
        $agent = Agent::factory()->for($team)->create();
        $phoneNumber = PhoneNumber::factory()
            ->for($team)
            ->for($agent, 'agent')
            ->create();
        $call = CallModel::factory()
            ->for($team)
            ->for($agent)
            ->for($phoneNumber)
            ->create([
                'messages' => [['role' => 'user', 'content' => 'Hello']],
            ]);

        $this->assertTrue($team->fresh()->calls->contains($call));
        $this->assertTrue($agent->fresh()->calls->contains($call));
        $this->assertTrue($phoneNumber->fresh()->calls->contains($call));
        $this->assertTrue($call->agent->is($agent));
        $this->assertTrue($call->phoneNumber->is($phoneNumber));
        $this->assertIsArray($call->messages);
        $this->assertIsObject($call->started_at);
        $this->assertIsObject($call->ended_at);
    }

    public function test_phone_numbers_and_call_sids_are_unique(): void
    {
        $team = Team::factory()->create();
        $agent = Agent::factory()->for($team)->create();
        $phoneNumber = PhoneNumber::factory()
            ->for($team)
            ->for($agent, 'agent')
            ->create();

        $this->expectException(QueryException::class);

        PhoneNumber::factory()
            ->for($team)
            ->for($agent, 'agent')
            ->create(['number' => $phoneNumber->number]);
    }

    public function test_default_factories_keep_related_records_in_the_same_team(): void
    {
        $phoneNumber = PhoneNumber::factory()->create();
        $call = CallModel::factory()->create();

        $this->assertSame($phoneNumber->team_id, $phoneNumber->agent->team_id);
        $this->assertSame($call->team_id, $call->agent->team_id);
        $this->assertSame($call->team_id, $call->phoneNumber->team_id);
        $this->assertSame($call->agent_id, $call->phoneNumber->agent_id);
    }

    public function test_package_migrations_can_be_reversed_and_reapplied(): void
    {
        $migrations = [
            require base_path('packages/telephony/database/migrations/2026_09_04_000001_create_agents_table.php'),
            require base_path('packages/telephony/database/migrations/2026_09_04_000002_create_phone_numbers_table.php'),
            require base_path('packages/telephony/database/migrations/2026_09_04_000003_create_calls_table.php'),
        ];

        foreach (array_reverse($migrations) as $migration) {
            $migration->down();
        }

        foreach ($migrations as $migration) {
            $migration->up();
        }

        $this->assertTrue(Schema::hasTable('agents'));
        $this->assertTrue(Schema::hasTable('phone_numbers'));
        $this->assertTrue(Schema::hasTable('calls'));
    }
}
