<?php

namespace Call\Telephony;

use Illuminate\Support\ServiceProvider;

class TelephonyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/telephony.php', 'telephony');
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}
