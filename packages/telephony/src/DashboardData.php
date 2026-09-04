<?php

namespace Call\Telephony;

use App\Models\Team;

class DashboardData
{
    /** @return array{agents: array<int, array<string, mixed>>, phoneNumbers: array<int, array<string, mixed>>, calls: array<int, array<string, mixed>>} */
    public function forTeam(Team $team): array
    {
        return [
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
                ])
                ->all(),
            'phoneNumbers' => $team->phoneNumbers()
                ->with('agent:id,name')
                ->latest()
                ->get()
                ->map(fn ($phoneNumber) => [
                    'id' => $phoneNumber->id,
                    'number' => $phoneNumber->number,
                    'agentId' => $phoneNumber->agent_id,
                    'agentName' => $phoneNumber->agent?->name,
                    'isActive' => $phoneNumber->is_active,
                ])
                ->all(),
            'calls' => $team->calls()
                ->with(['agent:id,name', 'phoneNumber:id,number'])
                ->latest('started_at')
                ->limit(20)
                ->get()
                ->map(fn ($call) => [
                    'id' => $call->id,
                    'callerNumber' => $call->caller_number,
                    'status' => $call->status,
                    'summary' => $call->summary,
                    'outcome' => $call->outcome,
                    'agentName' => $call->agent?->name,
                    'phoneNumber' => $call->phoneNumber->number,
                    'startedAt' => $call->started_at?->toISOString(),
                    'endedAt' => $call->ended_at?->toISOString(),
                ])
                ->all(),
        ];
    }
}
