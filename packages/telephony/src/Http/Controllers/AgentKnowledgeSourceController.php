<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
use Call\Telephony\Enums\KnowledgeSourceStatus;
use Call\Telephony\Enums\KnowledgeSourceType;
use Call\Telephony\Http\Requests\StoreKnowledgeSourceRequest;
use Call\Telephony\Jobs\ProcessAgentKnowledgeSource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AgentKnowledgeSourceController extends Controller
{
    public function index(Request $request): Response
    {
        $team = $this->team($request->route('current_team'));
        $agent = $team->agents()->findOrFail($request->route('agent'));

        return Inertia::render('agents/knowledge-sources/index', [
            'agent' => [
                'id' => $agent->id,
                'name' => $agent->name,
            ],
            'storeUrl' => route('knowledge-sources.store', [
                'current_team' => $team->slug,
                'agent' => $agent,
            ]),
            'knowledgeSources' => $agent->knowledgeSources()
                ->latest()
                ->get()
                ->map(fn ($source) => [
                    'id' => $source->id,
                    'type' => $source->type->value,
                    'title' => $source->title,
                    'url' => $source->url,
                    'originalFilename' => $source->original_filename,
                    'fileSize' => $source->file_size,
                    'status' => $source->status->value,
                    'errorMessage' => $source->error_message,
                ])
                ->all(),
        ]);
    }

    public function store(StoreKnowledgeSourceRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $agent = $team->agents()->findOrFail($request->route('agent'));
        $validated = $request->validated();
        $attachment = $request->file('attachment');

        $storagePath = null;

        try {
            $storagePath = $attachment?->store("knowledge/{$agent->id}", (string) config('filesystems.default'));

            $source = $agent->knowledgeSources()->create([
                'type' => $validated['type'],
                'title' => $validated['title'],
                'url' => $validated['type'] === KnowledgeSourceType::Url->value ? $validated['url'] : null,
                'content' => $validated['type'] === KnowledgeSourceType::Text->value ? $validated['content'] : null,
                'storage_path' => $storagePath,
                'original_filename' => $attachment !== null ? $attachment->getClientOriginalName() : null,
                'mime_type' => $attachment !== null ? $attachment->getClientMimeType() : null,
                'file_size' => $attachment?->getSize(),
                'status' => KnowledgeSourceStatus::Pending,
                'processing_at' => null,
            ]);
        } catch (Throwable $exception) {
            if ($storagePath !== null) {
                Storage::disk((string) config('filesystems.default'))->delete($storagePath);
            }

            throw $exception;
        }

        ProcessAgentKnowledgeSource::dispatch($source);

        return back();
    }

    public function retry(Request $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $agent = $team->agents()->findOrFail($request->route('agent'));
        $source = $agent->knowledgeSources()->findOrFail($request->route('knowledge_source'));

        abort_unless($source->status === KnowledgeSourceStatus::Failed, 422);

        $source->update([
            'status' => KnowledgeSourceStatus::Pending,
            'content' => $source->type === KnowledgeSourceType::Text ? $source->content : null,
            'error_message' => null,
            'processing_at' => null,
        ]);

        ProcessAgentKnowledgeSource::dispatch($source);

        return back();
    }

    public function destroy(Request $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $agent = $team->agents()->findOrFail($request->route('agent'));
        $source = $agent->knowledgeSources()->findOrFail($request->route('knowledge_source'));

        if ($source->storage_path !== null) {
            Storage::disk((string) config('filesystems.default'))->delete($source->storage_path);
        }

        $source->delete();

        return back();
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
