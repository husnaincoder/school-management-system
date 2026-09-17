<?php

namespace App\Http\Concerns;

use Illuminate\Http\Request;

trait NormalizesOptionalEmail
{
    protected function normalizeOptionalEmail(Request $request): void
    {
        $request->merge([
            'email' => filled($request->input('email')) ? $request->input('email') : null,
        ]);
    }
}
