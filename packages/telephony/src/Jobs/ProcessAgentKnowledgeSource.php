<?php

namespace Call\Telephony\Jobs;

use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Models\AgentKnowledgeSource;
use Call\Telephony\Services\KnowledgeSourceExtractor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProcessAgentKnowledgeSource implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    public int $timeout = 30;

    public int $tries = 1;

    public function __construct(public AgentKnowledgeSource $source) {}

    public function handle(KnowledgeSourceExtractor $extractor): void
    {
        $source = $this->source->fresh();

        if ($source === null || ! $this->isProcessable($source)) {
            return;
        }

        $source->update([
            'status' => KnowledgeSourceStatus::Processing,
            'processing_at' => now(),
            'error_message' => null,
        ]);

        try {
            $content = $extractor->extract($source);

            $source->update([
                'content' => $content,
                'status' => KnowledgeSourceStatus::Ready,
                'processing_at' => null,
            ]);
        } catch (Throwable $exception) {
            $source->update([
                'status' => KnowledgeSourceStatus::Failed,
                'error_message' => $this->safeErrorMessage($exception),
                'processing_at' => null,
            ]);
        }
    }

    public function failed(?Throwable $exception): void
    {
        $source = $this->source->fresh();

        if ($source !== null) {
            $source->update([
                'status' => KnowledgeSourceStatus::Failed,
                'error_message' => 'Knowledge source processing failed.',
                'processing_at' => null,
            ]);
        }
    }

    private function isProcessable(AgentKnowledgeSource $source): bool
    {
        return $source->status === KnowledgeSourceStatus::Pending
            || ($source->status === KnowledgeSourceStatus::Processing
                && $source->processing_at?->lt(now()->subMinutes(10)));
    }

    private function safeErrorMessage(Throwable $exception): string
    {
        $message = $exception->getMessage();
        $safeMessages = [
            'Text knowledge source has no content.',
            'URL knowledge source has no URL.',
            'The URL host could not be resolved.',
            'The URL host must resolve to a public address.',
            'Attachment has no storage path.',
            'Attachment is unavailable in storage.',
            'Attachment format is not supported for text extraction.',
            'PDF extraction is unavailable because no PDF parser is installed.',
        ];

        if (in_array($message, $safeMessages, true) || preg_match('/^URL fetch failed with HTTP status \d+\.$/', $message) === 1) {
            return $message;
        }

        return 'Knowledge source processing failed.';
    }
}
