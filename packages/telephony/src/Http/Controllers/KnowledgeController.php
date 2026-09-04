<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
use Call\Telephony\Enums\KnowledgeSourceStatus;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $team = $this->team($request->route('current_team'));
        $agents = $team->agents()
            ->withCount('knowledgeSources')
            ->with(['knowledgeSources:id,agent_id,status'])
            ->latest()
            ->get();

        return Inertia::render('knowledge/index', [
            'agents' => $agents
                ->map(fn ($agent) => [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'sourceCount' => $agent->knowledge_sources_count,
                    'statuses' => collect(KnowledgeSourceStatus::cases())
                        ->mapWithKeys(fn (KnowledgeSourceStatus $status) => [
                            $status->value => $agent->knowledgeSources
                                ->where('status', $status)
                                ->count(),
                        ])
                        ->all(),
                    'sourcesUrl' => route('knowledge-sources.index', [
                        'current_team' => $team->slug,
                        'agent' => $agent,
                    ]),
                ])
                ->all(),
            'phoneNumbersCount' => $team->phoneNumbers()->count(),
        ]);
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
