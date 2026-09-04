<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CallHistoryController extends Controller
{
    private const DEFAULT_LIMIT = 25;

    private const MAX_LIMIT = 100;

    public function __invoke(Request $request): Response
    {
        $team = $this->team($request->route('current_team'));
        $limit = min(max($request->integer('limit', self::DEFAULT_LIMIT), 1), self::MAX_LIMIT);
        $calls = $team->calls()
            ->with(['agent:id,name', 'phoneNumber:id,number'])
            ->latest('started_at')
            ->paginate($limit)
            ->withQueryString();

        return Inertia::render('call-history/index', [
            'calls' => $calls->through(fn ($call) => [
                'id' => $call->id,
                'callerNumber' => $call->caller_number,
                'status' => $call->status,
                'summary' => $call->summary,
                'outcome' => $call->outcome,
                'agentName' => $call->agent?->name,
                'phoneNumber' => $call->phoneNumber?->number,
                'startedAt' => $call->started_at?->toISOString(),
                'endedAt' => $call->ended_at?->toISOString(),
            ]),
            'limit' => $limit,
            'summary' => [
                'total' => $team->calls()->count(),
                'completed' => $team->calls()->where('status', 'completed')->count(),
            ],
        ]);
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
