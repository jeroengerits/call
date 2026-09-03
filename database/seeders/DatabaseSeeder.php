<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $attributes = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'test@example.com',
        ];

        $user = User::query()->where('email', $attributes['email'])->first();

        if ($user) {
            $user->update($attributes);
        } else {
            User::factory()->create($attributes);
        }
    }
}
