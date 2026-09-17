<?php

return [
    /*
    |--------------------------------------------------------------------------
    | School name (for PDF header, etc.)
    |--------------------------------------------------------------------------
    */
    'name' => env('SCHOOL_NAME', env('APP_NAME', 'School')),

    /*
    |--------------------------------------------------------------------------
    | School logo path (relative to public directory, e.g. 'images/school-logo.png')
    | Used in invoice PDF. Leave empty to hide logo.
    |--------------------------------------------------------------------------
    */
    'logo_path' => env('SCHOOL_LOGO_PATH', 'images/school-logo.png'),

    /*
    |--------------------------------------------------------------------------
    | Address / phone shown on printable result cards
    |--------------------------------------------------------------------------
    */
    'address' => env('SCHOOL_ADDRESS', ''),
    'phone' => env('SCHOOL_PHONE', ''),
];
