<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CallHistoryController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $team = $this->team($request->route('current_team'));

        return Inertia::render('call-history/index', [
            'calls' => $team->calls()
                ->with(['agent:id,name', 'phoneNumber:id,number'])
                ->latest('started_at')
                ->limit(100)
                ->get()
                ->map(fn ($call) => [
                    'id' => $call->id,
                    'callerNumber' => $call->caller_number,
                    'status' => $call->status,
                    'summary' => $call->summary,
                    'outcome' => $call->outcome,
                    'agentName' => $call->agent->name,
                    'phoneNumber' => $call->phoneNumber->number,
                    'startedAt' => $call->started_at?->toISOString(),
                    'endedAt' => $call->ended_at?->toISOString(),
                ])
                ->all(),
            'limit' => 100,
        ]);
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
