<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Client>
 */
class ClientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'supervisor_name' => fake()->name(),
            'company_phone_number' => fake()->phoneNumber(),
            'company_email' => fake()->unique()->companyEmail(),
            'company_name' => fake()->company(),
            'company_address' => fake()->streetAddress(),
            'company_city' => fake()->city()
        ];
    }
} 