<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    /**
     * Cache the user ID to avoid querying on every client creation
     */
    protected static ?int $cachedUserId = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Use cached user ID or get the first existing user
        if (self::$cachedUserId === null) {
            self::$cachedUserId = User::first()?->id ?? 1;
        }

        return [
            'user_id' => self::$cachedUserId,
            'supervisor_name' => fake()->name(),
            'company_phone_number' => fake()->phoneNumber(),
            'company_email' => fake()->unique()->companyEmail(),
            'company_name' => fake()->company(),
            'company_registration_number' => fake()->numerify('#######'),
            'company_address' => fake()->streetAddress(),
            'company_city' => fake()->city()
        ];
    }
} 