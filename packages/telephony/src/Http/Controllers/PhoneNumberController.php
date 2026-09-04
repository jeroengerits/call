<?php

namespace Call\Telephony\Http\Controllers;

use App\Models\Team;
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

        return Inertia::render('phone-numbers/index', [
            'phoneNumbers' => $team->phoneNumbers()
                ->with('agent:id,name')
                ->latest()
                ->get()
                ->map(fn ($phoneNumber) => [
                    'id' => $phoneNumber->id,
                    'number' => $phoneNumber->number,
                    'agentId' => $phoneNumber->agent_id,
                    'agentName' => $phoneNumber->agent->name,
                    'isActive' => $phoneNumber->is_active,
                    'updateUrl' => route('phone-numbers.update', [
                        'current_team' => $team->slug,
                        'phone_number' => $phoneNumber,
                    ]),
                ])
                ->all(),
            'agents' => $team->agents()->select(['id', 'name'])->latest()->get(),
            'storeUrl' => route('phone-numbers.store', ['current_team' => $team->slug]),
        ]);
    }

    public function store(StorePhoneNumberRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $agent = $team->agents()->findOrFail($request->validated('agent_id'));

        $team->phoneNumbers()->create([
            ...$request->validated(),
            'agent_id' => $agent->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phone number added.')]);

        return back();
    }

    public function update(StorePhoneNumberRequest $request): RedirectResponse
    {
        $team = $this->team($request->route('current_team'));
        $phoneNumber = $team->phoneNumbers()->findOrFail($request->route('phone_number'));
        $agent = $team->agents()->findOrFail($request->validated('agent_id'));

        $phoneNumber->update([
            ...$request->validated(),
            'agent_id' => $agent->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phone number updated.')]);

        return back();
    }

    private function team(mixed $currentTeam): Team
    {
        return Team::query()->where('slug', $currentTeam)->firstOrFail();
    }
}
