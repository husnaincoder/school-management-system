<?php

namespace App\Http\Concerns;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

trait UpdatesOptionalPassword
{
    /**
     * Laravel keeps empty password fields as "" (not null), which fails nullable|min:8|confirmed.
     */
    protected function normalizeOptionalPassword(Request $request): void
    {
        $request->merge([
            'password' => filled($request->input('password')) ? $request->input('password') : null,
            'password_confirmation' => filled($request->input('password_confirmation'))
                ? $request->input('password_confirmation')
                : null,
        ]);
    }

    protected function optionalPasswordRules(): array
    {
        return [
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }

    protected function userDataWithOptionalPassword(array $userData, array $validated): array
    {
        if (! empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        return $userData;
    }
}
