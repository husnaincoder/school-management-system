<?php

namespace App\Support;

class UploadRules
{
    /**
     * Allowed extensions for school document uploads (materials, notice attachments).
     * No executables, scripts, HTML, or SVG (XSS risk).
     */
    public const DOCUMENT_EXTENSIONS = [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'txt',
        'csv',
    ];

    public static function documentExtensionsCsv(): string
    {
        return implode(',', self::DOCUMENT_EXTENSIONS);
    }

    /**
     * Laravel validation rule list for a single uploaded document.
     *
     * @return list<string>
     */
    public static function documentFile(int $maxKilobytes = 20480, bool $required = false): array
    {
        return [
            $required ? 'required' : 'nullable',
            'file',
            'max:'.$maxKilobytes,
            'mimes:'.self::documentExtensionsCsv(),
        ];
    }

    /**
     * HTML accept attribute value for document uploads.
     */
    public static function documentAcceptAttribute(): string
    {
        return implode(',', array_map(
            static fn (string $ext) => '.'.$ext,
            self::DOCUMENT_EXTENSIONS
        ));
    }
}
