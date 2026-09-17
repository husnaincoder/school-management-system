<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = 'web';

        $superAdmin = User::firstOrCreate(
            ['id_card_number' => '3660315391873'],
            [
                'name' => 'Muhammad Javed',
                'email' => 'superadmin@school.com',
                'phone' => '+1234567890',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->syncRoles([Role::findByName('super_admin', $guard)]);

        $admin = User::firstOrCreate(
            ['id_card_number' => '3660356234131'],
            [
                'name' => 'Ahmad Ali',
                'email' => 'admin@school.com',
                'phone' => '+1234567891',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $admin->syncRoles([Role::findByName('admin', $guard)]);

        $accountant = User::firstOrCreate(
            ['id_card_number' => 'AC00001'],
            [
                'name' => 'Accountant',
                'email' => 'accountant@school.com',
                'phone' => '+1234567892',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );
        $accountant->syncRoles([Role::findByName('accountant', $guard)]);

        $teachers = [
            ['name' => 'John Smith', 'id_card_number' => 'TCH00001', 'email' => 'john.smith@school.com'],
            ['name' => 'Sarah Johnson', 'id_card_number' => 'TCH00002', 'email' => 'sarah.johnson@school.com'],
            ['name' => 'Michael Brown', 'id_card_number' => 'TCH00003', 'email' => 'michael.brown@school.com'],
        ];

        foreach ($teachers as $teacher) {
            $user = User::firstOrCreate(
                ['id_card_number' => $teacher['id_card_number']],
                [
                    'name' => $teacher['name'],
                    'email' => $teacher['email'],
                    'phone' => '+123456789' . rand(3, 9),
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles([Role::findByName('teacher', $guard)]);
            Teacher::firstOrCreate(
                ['user_id' => $user->id],
                ['status' => 'active', 'is_active' => true]
            );
        }

        $employees = [
            ['name' => 'David Wilson', 'id_card_number' => 'EMP00001', 'email' => 'david.wilson@school.com'],
            ['name' => 'Lisa Davis', 'id_card_number' => 'EMP00002', 'email' => 'lisa.davis@school.com'],
        ];

        foreach ($employees as $employee) {
            $user = User::firstOrCreate(
                ['id_card_number' => $employee['id_card_number']],
                [
                    'name' => $employee['name'],
                    'email' => $employee['email'],
                    'phone' => '+123456789' . rand(3, 9),
                    'password' => Hash::make('password123'),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles([Role::findByName('employee', $guard)]);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
