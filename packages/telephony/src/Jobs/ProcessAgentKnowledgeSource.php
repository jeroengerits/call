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

    public function __construct(public AgentKnowledgeSource $source) {}

    public function handle(KnowledgeSourceExtractor $extractor): void
    {
        $source = $this->source->fresh();

        if ($source === null || $source->status !== KnowledgeSourceStatus::Pending) {
            return;
        }

        $source->update([
            'status' => KnowledgeSourceStatus::Processing,
            'error_message' => null,
        ]);

        try {
            $content = $extractor->extract($source);

            $source->update([
                'content' => $content,
                'status' => KnowledgeSourceStatus::Ready,
            ]);
        } catch (Throwable $exception) {
            $source->update([
                'status' => KnowledgeSourceStatus::Failed,
                'error_message' => $exception->getMessage(),
            ]);
        }
    }
}
