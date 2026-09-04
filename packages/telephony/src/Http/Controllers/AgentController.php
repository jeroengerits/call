<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
use Call\Telephony\Http\Requests\StoreAgentRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(Request $request): Response
    {
        $team = $this->team($request->route('current_team'));

        return Inertia::render('agents/index', [
            'agents' => $team->agents()
                ->withCount('phoneNumbers')
                ->latest()
                ->get()
                ->map(fn ($agent) => [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'language' => $agent->language,
                    'greeting' => $agent->greeting,
                    'instructions' => $agent->instructions,
                    'knowledge' => $agent->knowledge,
                    'isActive' => $agent->is_active,
                    'phoneNumbersCount' => $agent->phone_numbers_count,
                    'knowledgeUrl' => route('knowledge-sources.index', [
                        'current_team' => $team->slug,
                        'agent' => $agent,
                    ]),
                    'updateUrl' => route('agents.update', [
                        'current_team' => $team->slug,
                        'agent' => $agent,
                    ]),
                ])
                ->all(),
            'storeUrl' => route('agents.store', ['current_team' => $team->slug]),
            'phoneNumbersCount' => $team->phoneNumbers()->count(),
        ]);
    }

    public function store(StoreAgentRequest $request): RedirectResponse
    {
        $this->team($request->route('current_team'))
            ->agents()
            ->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Agent created.')]);

        return back();
    }

    public function update(StoreAgentRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $agent = $team->agents()->findOrFail($request->route('agent'));

        $agent->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Agent updated.')]);

        return back();
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
