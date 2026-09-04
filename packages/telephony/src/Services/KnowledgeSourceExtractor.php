<?php

namespace Call\Telephony\Services;

use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Models\AgentKnowledgeSource;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class KnowledgeSourceExtractor
{
    public function __construct(private readonly UrlSafety $urlSafety) {}

    public function extract(AgentKnowledgeSource $source): string
    {
        return match ($source->type) {
            KnowledgeSourceType::Text => $this->extractText($source),
            KnowledgeSourceType::Url => $this->extractUrl($source),
            KnowledgeSourceType::Attachment => $this->extractAttachment($source),
        };
    }

    private function extractText(AgentKnowledgeSource $source): string
    {
        if ($source->content === null) {
            throw new RuntimeException('Text knowledge source has no content.');
        }

        return $source->content;
    }

    private function extractUrl(AgentKnowledgeSource $source): string
    {
        if ($source->url === null) {
            throw new RuntimeException('URL knowledge source has no URL.');
        }

        $parts = parse_url($source->url);
        $host = (string) ($parts['host'] ?? '');
        $port = (int) ($parts['port'] ?? (strtolower((string) ($parts['scheme'] ?? '')) === 'https' ? 443 : 80));
        $address = $this->urlSafety->safeAddress($source->url);

        $response = Http::withoutRedirecting()
            ->withOptions(['curl' => [CURLOPT_RESOLVE => ["{$host}:{$port}:{$address}"]]])
            ->connectTimeout(5)
            ->timeout(10)
            ->get($source->url);

        if (! $response->successful()) {
            throw new RuntimeException($this->urlFailureMessage($response));
        }

        return $response->body();
    }

    private function extractAttachment(AgentKnowledgeSource $source): string
    {
        $mimeType = strtolower((string) $source->mime_type);
        $filename = strtolower((string) $source->original_filename);

        if ($mimeType === 'application/pdf' || str_ends_with($filename, '.pdf')) {
            throw new RuntimeException('PDF extraction is unavailable because no PDF parser is installed.');
        }

        if (! $this->isPlainTextAttachment($mimeType, $filename)) {
            throw new RuntimeException('Attachment format is not supported for text extraction.');
        }

        if ($source->storage_path === null) {
            throw new RuntimeException('Attachment has no storage path.');
        }

        $disk = Storage::disk((string) config('filesystems.knowledge_disk'));

        if (! $disk->exists($source->storage_path)) {
            throw new RuntimeException('Attachment is unavailable in storage.');
        }

        return $disk->get($source->storage_path);
    }

    private function isPlainTextAttachment(string $mimeType, string $filename): bool
    {
        return in_array($mimeType, ['text/plain', 'text/markdown', 'text/csv', 'application/json'], true)
            || preg_match('/\.(txt|text|md|markdown|csv|json|xml)$/', $filename) === 1;
    }

    private function urlFailureMessage(Response $response): string
    {
        return sprintf('URL fetch failed with HTTP status %d.', $response->status());
    }
}
