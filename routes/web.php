<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Call\Telephony\Http\Controllers\AgentController;
use Call\Telephony\Http\Controllers\AgentKnowledgeSourceController;
use Call\Telephony\Http\Controllers\CallHistoryController;
use Call\Telephony\Http\Controllers\KnowledgeController;
use Call\Telephony\Http\Controllers\PhoneNumberController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('call-history', CallHistoryController::class)->name('call-history.index');
        Route::get('knowledge', KnowledgeController::class)->name('knowledge.index');
        Route::get('agents', [AgentController::class, 'index'])->name('agents.index');
        Route::post('agents', [AgentController::class, 'store'])->name('agents.store');
        Route::patch('agents/{agent}', [AgentController::class, 'update'])->name('agents.update');
        Route::get('agents/{agent}/knowledge-sources', [AgentKnowledgeSourceController::class, 'index'])->name('knowledge-sources.index');
        Route::post('agents/{agent}/knowledge-sources', [AgentKnowledgeSourceController::class, 'store'])->name('knowledge-sources.store');
        Route::post('agents/{agent}/knowledge-sources/{knowledge_source}/retry', [AgentKnowledgeSourceController::class, 'retry'])->name('knowledge-sources.retry');
        Route::delete('agents/{agent}/knowledge-sources/{knowledge_source}', [AgentKnowledgeSourceController::class, 'destroy'])->name('knowledge-sources.destroy');
        Route::get('phone-numbers', [PhoneNumberController::class, 'index'])->name('phone-numbers.index');
        Route::post('phone-numbers', [PhoneNumberController::class, 'store'])->name('phone-numbers.store');
        Route::patch('phone-numbers/{phone_number}', [PhoneNumberController::class, 'update'])->name('phone-numbers.update');
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
