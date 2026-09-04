<?php

namespace Call\Telephony\Tests;

use App\Models\Team;
use App\Models\User;
use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Jobs\ProcessAgentKnowledgeSource;
use Call\Telephony\Models\Agent;
use Call\Telephony\Models\AgentKnowledgeSource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
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

    public function test_a_team_member_can_create_a_text_knowledge_source_and_queue_processing(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'text',
                'title' => 'Support guide',
                'content' => 'Use the support portal.',
            ])
            ->assertRedirect();

        $source = AgentKnowledgeSource::query()->firstOrFail();
        $this->assertSame(KnowledgeSourceStatus::Pending, $source->status);
        $this->assertSame(KnowledgeSourceType::Text, $source->type);
        Queue::assertPushed(ProcessAgentKnowledgeSource::class, fn ($job): bool => $job->source->is($source));
    }

    public function test_a_team_member_can_create_a_url_knowledge_source(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'url',
                'title' => 'Support guide',
                'url' => 'https://example.test/guide',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('agent_knowledge_sources', [
            'agent_id' => $agent->id,
            'type' => 'url',
            'url' => 'https://example.test/guide',
            'status' => 'pending',
        ]);
    }

    public function test_url_knowledge_sources_require_a_valid_url(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'url',
                'title' => 'Support guide',
            ])
            ->assertSessionHasErrors(['url']);
    }

    public function test_attachment_knowledge_sources_are_stored_on_the_private_disk(): void
    {
        Queue::fake();
        Storage::fake();
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        $attachment = UploadedFile::fake()->create('guide.md', 10, 'text/markdown');

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'attachment',
                'title' => 'Markdown guide',
                'attachment' => $attachment,
            ])
            ->assertRedirect();

        $source = AgentKnowledgeSource::query()->firstOrFail();
        Storage::assertExists($source->storage_path);
        $this->assertSame('guide.md', $source->original_filename);
        $this->assertSame(10 * 1024, $source->file_size);
    }

    public function test_attachments_reject_unsupported_formats_and_files_over_the_size_limit(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'attachment',
                'title' => 'Word guide',
                'attachment' => UploadedFile::fake()->create('guide.docx', 10),
            ])
            ->assertSessionHasErrors(['attachment']);

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'attachment',
                'title' => 'Large guide',
                'attachment' => UploadedFile::fake()->create('guide.pdf', 10241),
            ])
            ->assertSessionHasErrors(['attachment']);
    }

    public function test_a_failed_source_can_be_retried_only_through_its_agent(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        $source = AgentKnowledgeSource::factory()->for($agent)->create([
            'status' => KnowledgeSourceStatus::Failed,
            'error_message' => 'Temporary failure.',
        ]);

        $this->actingAs($user)
            ->post(route('knowledge-sources.retry', [$team, $agent, $source]))
            ->assertRedirect();

        $this->assertSame(KnowledgeSourceStatus::Pending, $source->refresh()->status);
        $this->assertNull($source->error_message);
        Queue::assertPushed(ProcessAgentKnowledgeSource::class);
    }

    public function test_destroying_a_knowledge_source_removes_its_private_file(): void
    {
        Storage::fake();
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        Storage::put('knowledge/'.$agent->id.'/guide.md', '# Guide');
        $source = AgentKnowledgeSource::factory()->for($agent)->create([
            'type' => KnowledgeSourceType::Attachment,
            'storage_path' => 'knowledge/'.$agent->id.'/guide.md',
            'original_filename' => 'guide.md',
        ]);

        $this->actingAs($user)
            ->delete(route('knowledge-sources.destroy', [$team, $agent, $source]))
            ->assertRedirect();

        Storage::assertMissing($source->storage_path);
        $this->assertDatabaseMissing('agent_knowledge_sources', ['id' => $source->id]);
    }
}
