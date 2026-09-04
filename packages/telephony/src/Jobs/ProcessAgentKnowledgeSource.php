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
                'error_message' => $exception->getMessage(),
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
                'error_message' => $exception?->getMessage() ?? 'Knowledge source processing failed.',
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
}
