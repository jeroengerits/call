<?php

namespace Call\Telephony\Tests;

use App\Models\Team;
use App\Models\User;
use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Jobs\ProcessAgentKnowledgeSource;
use Call\Telephony\Models\Agent;
use Call\Telephony\Models\AgentKnowledgeSource;
use Call\Telephony\Models\Call as CallModel;
use Call\Telephony\Models\PhoneNumber;
use Illuminate\Contracts\Bus\Dispatcher;
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
            ->assertOk();
    }

    public function test_team_calls_are_scoped_and_paginated(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        $phoneNumber = $team->phoneNumbers()->create([
            'agent_id' => $agent->id,
            'number' => '+15550101234',
            'is_active' => true,
        ]);
        CallModel::factory()->for($team)->for($agent)->for($phoneNumber)->count(3)->create();
        $otherTeam = Team::factory()->create();
        CallModel::factory()->for($otherTeam)->count(2)->create();

        $this->actingAs($user)
            ->get(route('calls.index', ['current_team' => $team, 'limit' => 2]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('call-history/index')
                ->has('calls.data', 2)
                ->where('calls.total', 3)
                ->where('calls.per_page', 2)
                ->where('summary.total', 3)
                ->where('summary.completed', 3),
            );

        $this->actingAs($user)
            ->get(route('calls.index', ['current_team' => $team, 'limit' => 1000]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('calls.per_page', 100)
                ->has('calls.data', 3),
            );
    }

    public function test_call_history_route_remains_available_as_a_compatibility_alias(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('call-history.index', $user->currentTeam))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('call-history/index'));
    }

    public function test_team_knowledge_overview_serializes_source_statuses(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        AgentKnowledgeSource::factory()->for($agent)->create([
            'status' => KnowledgeSourceStatus::Ready,
        ]);
        AgentKnowledgeSource::factory()->for($agent)->create([
            'status' => KnowledgeSourceStatus::Failed,
        ]);

        $this->actingAs($user)
            ->get(route('knowledge.index', $team))
            ->assertOk();
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
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('agents', [
            'team_id' => $team->id,
            'name' => 'Reception',
            'knowledge' => null,
        ]);
    }

    public function test_a_team_member_can_update_an_agent_without_managing_inline_knowledge(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create([
            'knowledge' => 'Existing managed data.',
        ]);

        $response = $this->actingAs($user)->patch(route('agents.update', [$team, $agent]), [
            'name' => 'Updated reception',
            'language' => 'en-US',
            'greeting' => 'Welcome',
            'instructions' => 'Be brief',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('agents', [
            'id' => $agent->id,
            'name' => 'Updated reception',
            'knowledge' => 'Existing managed data.',
        ]);
    }

    public function test_agent_index_excludes_inline_knowledge_from_the_managed_form_contract(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create([
            'knowledge' => 'Existing managed data.',
        ]);

        $this->actingAs($user)
            ->get(route('agents.index', $team))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('agents/index')
                ->where('agents.0.id', $agent->id)
                ->missing('agents.0.knowledge'),
            );
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

    public function test_a_team_member_can_create_an_unassigned_phone_number_before_agents_exist(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;

        $this->actingAs($user)
            ->post(route('phone-numbers.store', $team), ['number' => '+15550109999'])
            ->assertRedirect();

        $this->assertDatabaseHas('phone_numbers', [
            'team_id' => $team->id,
            'agent_id' => null,
            'number' => '+15550109999',
        ]);
    }

    public function test_a_team_member_can_delete_a_phone_number(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $phoneNumber = PhoneNumber::factory()->for($team)->create();

        $this->actingAs($user)
            ->delete(route('phone-numbers.destroy', [$team, $phoneNumber]))
            ->assertRedirect();

        $this->assertDatabaseMissing('phone_numbers', ['id' => $phoneNumber->id]);
    }

    public function test_a_team_member_can_delete_an_agent_and_its_related_records(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        $phoneNumber = PhoneNumber::factory()->for($team)->for($agent, 'agent')->create();
        $call = CallModel::factory()->for($team)->for($agent)->for($phoneNumber)->create();

        $this->actingAs($user)
            ->delete(route('agents.destroy', [$team, $agent]))
            ->assertRedirect();

        $this->assertDatabaseMissing('agents', ['id' => $agent->id]);
        $this->assertDatabaseMissing('phone_numbers', ['id' => $phoneNumber->id]);
        $this->assertDatabaseMissing('calls', ['id' => $call->id]);
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
                'url' => 'https://example.com/guide',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('agent_knowledge_sources', [
            'agent_id' => $agent->id,
            'type' => 'url',
            'url' => 'https://example.com/guide',
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

    public function test_text_knowledge_sources_reject_content_over_the_configured_byte_limit(): void
    {
        config(['telephony.knowledge.max_text_bytes' => 4]);
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'text',
                'title' => 'Oversized guide',
                'content' => '12345',
            ])
            ->assertSessionHasErrors(['content']);

        $this->assertDatabaseCount('agent_knowledge_sources', 0);
    }

    public function test_source_is_marked_failed_when_processing_cannot_be_dispatched(): void
    {
        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('dispatch')->once()->andThrow(new \RuntimeException('Queue unavailable.'));
        $this->app->instance(Dispatcher::class, $dispatcher);

        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'text',
                'title' => 'Support guide',
                'content' => 'Use the support portal.',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors(['source']);

        $source = AgentKnowledgeSource::query()->firstOrFail();
        $this->assertSame(KnowledgeSourceStatus::Failed, $source->status);
        $this->assertSame('Knowledge source could not be queued.', $source->error_message);
    }

    public function test_url_knowledge_sources_reject_private_addresses_and_irrelevant_fields(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'url',
                'title' => 'Internal guide',
                'url' => 'http://127.0.0.1/admin',
                'content' => 'Must not be stored.',
            ])
            ->assertSessionHasErrors(['url']);

        $this->assertDatabaseCount('agent_knowledge_sources', 0);
    }

    public function test_attachment_knowledge_sources_are_stored_on_the_private_disk(): void
    {
        Queue::fake();
        config(['filesystems.default' => 'public']);
        Storage::fake('knowledge_private');
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
        Storage::disk('knowledge_private')->assertExists($source->storage_path);
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

    public function test_plain_text_attachments_are_rejected_over_the_configured_byte_limit(): void
    {
        config(['telephony.knowledge.max_text_bytes' => 4]);
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();

        $this->actingAs($user)
            ->post(route('knowledge-sources.store', [$team, $agent]), [
                'type' => 'attachment',
                'title' => 'Oversized text',
                'attachment' => UploadedFile::fake()->createWithContent('guide.txt', '12345'),
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
        config(['filesystems.default' => 'public']);
        Storage::fake('knowledge_private');
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        Storage::disk('knowledge_private')->put('knowledge/'.$agent->id.'/guide.md', '# Guide');
        $source = AgentKnowledgeSource::factory()->for($agent)->create([
            'type' => KnowledgeSourceType::Attachment,
            'storage_path' => 'knowledge/'.$agent->id.'/guide.md',
            'original_filename' => 'guide.md',
        ]);

        $this->actingAs($user)
            ->delete(route('knowledge-sources.destroy', [$team, $agent, $source]))
            ->assertRedirect();

        Storage::disk('knowledge_private')->assertMissing($source->storage_path);
        $this->assertDatabaseMissing('agent_knowledge_sources', ['id' => $source->id]);
    }

    public function test_knowledge_sources_are_not_visible_across_teams(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $otherTeam = Team::factory()->create();
        $agent = Agent::factory()->for($team)->create();
        AgentKnowledgeSource::factory()->for($agent)->create();
        $otherAgent = Agent::factory()->for($otherTeam)->create();

        $this->actingAs($user)
            ->get(route('knowledge-sources.index', [$otherTeam, $otherAgent]))
            ->assertForbidden();
    }

    public function test_retry_cannot_target_a_source_from_another_agent(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        $otherAgent = Agent::factory()->for($team)->create();
        $source = AgentKnowledgeSource::factory()->for($otherAgent)->create(['status' => KnowledgeSourceStatus::Failed]);

        $this->actingAs($user)
            ->post(route('knowledge-sources.retry', [$team, $agent, $source]))
            ->assertNotFound();

        Queue::assertNothingPushed();
    }

    public function test_destroy_cannot_delete_a_source_from_another_agent(): void
    {
        $user = User::factory()->create();
        $team = $user->currentTeam;
        $agent = Agent::factory()->for($team)->create();
        $otherAgent = Agent::factory()->for($team)->create();
        $source = AgentKnowledgeSource::factory()->for($otherAgent)->create();

        $this->actingAs($user)
            ->delete(route('knowledge-sources.destroy', [$team, $agent, $source]))
            ->assertNotFound();

        $this->assertDatabaseHas('agent_knowledge_sources', ['id' => $source->id]);
    }
}
