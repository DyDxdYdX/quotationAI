<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@dydxsoft.com',
            'phone_number' => '+60177766540',
            'password' => Hash::make('admin123'),
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
        ]);

        Client::factory(20)->create();
    }
}
