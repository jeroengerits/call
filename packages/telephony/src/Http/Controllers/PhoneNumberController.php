<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
use Call\Telephony\Http\Requests\DeletePhoneNumberRequest;
use Call\Telephony\Http\Requests\StorePhoneNumberRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class PhoneNumberController extends Controller
{
    public function index(Request $request): Response
    {
        $team = $this->team($request->route('current_team'));
        $agents = $team->agents()->select(['id', 'name'])->latest()->get();
        $knowledgeSourcesCount = $team->agents()
            ->withCount('knowledgeSources')
            ->get()
            ->sum('knowledge_sources_count');

        return Inertia::render('phone-numbers/index', [
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
                    'updateUrl' => route('phone-numbers.update', [
                        'current_team' => $team->slug,
                        'phone_number' => $phoneNumber,
                    ]),
                ])
                ->all(),
            'agents' => $agents,
            'agentsCount' => $agents->count(),
            'knowledgeSourcesCount' => $knowledgeSourcesCount,
            'storeUrl' => route('phone-numbers.store', ['current_team' => $team->slug]),
        ]);
    }

    public function store(StorePhoneNumberRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $agentId = $request->validated('agent_id');

        if ($agentId !== null) {
            $team->agents()->findOrFail($agentId);
        }

        $team->phoneNumbers()->create([
            ...$request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phone number added.')]);

        return back();
    }

    public function update(StorePhoneNumberRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $phoneNumber = $team->phoneNumbers()->findOrFail($request->route('phone_number'));
        $agentId = $request->validated('agent_id');

        if ($agentId !== null) {
            $team->agents()->findOrFail($agentId);
        }

        $phoneNumber->update([
            ...$request->validated(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phone number updated.')]);

        return back();
    }

    public function destroy(DeletePhoneNumberRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $team->phoneNumbers()->findOrFail($request->route('phone_number'))->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phone number removed.')]);

        return back();
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
