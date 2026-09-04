<?php

namespace Call\Telephony\Tests;

use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Jobs\ProcessAgentKnowledgeSource;
use Call\Telephony\Models\AgentKnowledgeSource;
use Call\Telephony\Services\KnowledgeSourceExtractor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class KnowledgeSourceProcessingTest extends TestCase
{
    use RefreshDatabase;

    public function test_text_sources_are_processed_to_ready(): void
    {
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Text,
            'content' => 'Use the support portal for account changes.',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $source->refresh();

        $this->assertSame(KnowledgeSourceStatus::Ready, $source->status);
        $this->assertSame('Use the support portal for account changes.', $source->content);
        $this->assertNull($source->error_message);
    }

    public function test_url_sources_fetch_body_with_successful_response(): void
    {
        Http::fake(['https://example.com/guide' => Http::response('Remote guide content.', 200)]);
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Url,
            'content' => null,
            'url' => 'https://example.com/guide',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $this->assertSame(KnowledgeSourceStatus::Ready, $source->refresh()->status);
        $this->assertSame('Remote guide content.', $source->content);
        Http::assertSent(fn ($request): bool => $request->url() === 'https://example.com/guide');
    }

    public function test_plain_text_attachments_are_processed_to_ready(): void
    {
        Storage::fake('knowledge_private');
        Storage::disk('knowledge_private')->put('knowledge/guide.md', '# Guide\n\nPlain text.');
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Attachment,
            'content' => null,
            'storage_path' => 'knowledge/guide.md',
            'original_filename' => 'guide.md',
            'mime_type' => 'text/markdown',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $this->assertSame(KnowledgeSourceStatus::Ready, $source->refresh()->status);
        $this->assertSame('# Guide\n\nPlain text.', $source->content);
    }

    public function test_http_status_failures_are_persisted_without_ready_content(): void
    {
        Http::fake(['https://example.com/missing' => Http::response('Not found', 404)]);
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Url,
            'content' => null,
            'url' => 'https://example.com/missing',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $source->refresh();
        $this->assertSame(KnowledgeSourceStatus::Failed, $source->status);
        $this->assertSame('URL fetch failed with HTTP status 404.', $source->error_message);
        $this->assertNull($source->content);
    }

    public function test_url_redirects_are_not_followed(): void
    {
        Http::fake(['https://example.com/redirect' => Http::response('', 302, ['Location' => 'http://127.0.0.1/admin'])]);
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Url,
            'content' => null,
            'url' => 'https://example.com/redirect',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $this->assertSame(KnowledgeSourceStatus::Failed, $source->refresh()->status);
        $this->assertSame('URL fetch failed with HTTP status 302.', $source->error_message);
        Http::assertSentCount(1);
    }

    public function test_unavailable_urls_are_persisted_as_failed(): void
    {
        Http::fake(['https://example.com/down' => Http::failedConnection()]);
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Url,
            'content' => null,
            'url' => 'https://example.com/down',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $source->refresh();
        $this->assertSame(KnowledgeSourceStatus::Failed, $source->status);
        $this->assertNotEmpty($source->error_message);
    }

    public function test_pdf_and_unsupported_attachments_fail_safely(): void
    {
        Storage::fake('knowledge_private');
        Storage::disk('knowledge_private')->put('knowledge/manual.pdf', '%PDF');
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Attachment,
            'content' => null,
            'storage_path' => 'knowledge/manual.pdf',
            'original_filename' => 'manual.pdf',
            'mime_type' => 'application/pdf',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $source->refresh();
        $this->assertSame(KnowledgeSourceStatus::Failed, $source->status);
        $this->assertSame('PDF extraction is unavailable because no PDF parser is installed.', $source->error_message);
    }

    public function test_unsupported_attachments_are_persisted_as_failed(): void
    {
        Storage::fake('knowledge_private');
        Storage::disk('knowledge_private')->put('knowledge/manual.docx', 'binary content');
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Attachment,
            'content' => null,
            'storage_path' => 'knowledge/manual.docx',
            'original_filename' => 'manual.docx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $source->refresh();
        $this->assertSame(KnowledgeSourceStatus::Failed, $source->status);
        $this->assertSame('Attachment format is not supported for text extraction.', $source->error_message);
    }

    public function test_stale_processing_sources_can_be_reclaimed(): void
    {
        Http::fake(['https://example.com/stale' => Http::response('Recovered content.')]);
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Url,
            'url' => 'https://example.com/stale',
            'status' => KnowledgeSourceStatus::Processing,
            'processing_at' => now()->subMinutes(11),
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $this->assertSame(KnowledgeSourceStatus::Ready, $source->refresh()->status);
        $this->assertNull($source->processing_at);
    }

    public function test_queue_failure_marks_processing_source_as_failed(): void
    {
        $source = AgentKnowledgeSource::factory()->create([
            'status' => KnowledgeSourceStatus::Processing,
            'processing_at' => now(),
        ]);

        (new ProcessAgentKnowledgeSource($source))->failed(new \RuntimeException('Worker timed out.'));

        $source->refresh();
        $this->assertSame(KnowledgeSourceStatus::Failed, $source->status);
        $this->assertSame('Knowledge source processing failed.', $source->error_message);
        $this->assertNull($source->processing_at);
    }

    public function test_untrusted_processing_errors_are_not_persisted(): void
    {
        Http::fake(['https://example.com/down' => Http::failedConnection()]);
        $source = AgentKnowledgeSource::factory()->create([
            'type' => KnowledgeSourceType::Url,
            'url' => 'https://example.com/down',
        ]);

        (new ProcessAgentKnowledgeSource($source))->handle(app(KnowledgeSourceExtractor::class));

        $this->assertSame('Knowledge source processing failed.', $source->refresh()->error_message);
    }
}
