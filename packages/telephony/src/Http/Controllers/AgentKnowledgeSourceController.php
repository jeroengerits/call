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

        $source = $agent->knowledgeSources()->create([
            'type' => $validated['type'],
            'title' => $validated['title'],
            'url' => $validated['url'] ?? null,
            'content' => $validated['content'] ?? null,
            'storage_path' => $attachment?->store("knowledge/{$agent->id}", 'local'),
            'original_filename' => $attachment?->getClientOriginalName(),
            'mime_type' => $attachment?->getClientMimeType(),
            'file_size' => $attachment?->getSize(),
            'status' => KnowledgeSourceStatus::Pending,
        ]);

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
            Storage::disk('local')->delete($source->storage_path);
        }

        $source->delete();

        return back();
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
