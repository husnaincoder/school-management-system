<?php

namespace App\Support;

/**
 * Helpers for reliable DomPDF image embedding on shared hosting.
 * Absolute filesystem paths often fail (open_basedir / chroot); data-URIs are safer.
 */
class PdfAssets
{
    /**
     * Convert a local image file to a data-URI for <img src="..."> in DomPDF.
     * Optionally downscales large images via GD to reduce memory pressure.
     */
    public static function dataUri(?string $absolutePath, int $maxEdge = 320): ?string
    {
        if (! $absolutePath || ! is_file($absolutePath) || ! is_readable($absolutePath)) {
            return null;
        }

        $bytes = @file_get_contents($absolutePath);
        if ($bytes === false || $bytes === '') {
            return null;
        }

        $mime = self::mimeType($absolutePath, $bytes);
        if (! $mime || ! str_starts_with($mime, 'image/')) {
            return null;
        }

        if (extension_loaded('gd') && in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
            $resized = self::maybeResize($bytes, $mime, $maxEdge);
            if ($resized !== null) {
                [$bytes, $mime] = $resized;
            }
        }

        return 'data:'.$mime.';base64,'.base64_encode($bytes);
    }

    /**
     * Ensure DomPDF can write cached fonts (common live 503 cause when missing/unwritable).
     */
    public static function ensureFontDirectory(): void
    {
        $dir = storage_path('fonts');
        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }

    /**
     * Bump limits briefly for PDF generation on constrained hosts.
     */
    public static function boostResources(): void
    {
        @ini_set('memory_limit', '256M');
        @set_time_limit(90);
    }

    private static function mimeType(string $path, string $bytes): ?string
    {
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $mime = finfo_buffer($finfo, $bytes) ?: null;
                finfo_close($finfo);
                if ($mime) {
                    return $mime;
                }
            }
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
            default => null,
        };
    }

    /**
     * @return array{0: string, 1: string}|null [bytes, mime]
     */
    private static function maybeResize(string $bytes, string $mime, int $maxEdge): ?array
    {
        $src = @imagecreatefromstring($bytes);
        if (! $src) {
            return null;
        }

        $width = imagesx($src);
        $height = imagesy($src);
        if ($width < 1 || $height < 1) {
            imagedestroy($src);

            return null;
        }

        $edge = max($width, $height);
        if ($edge <= $maxEdge) {
            imagedestroy($src);

            return null;
        }

        $scale = $maxEdge / $edge;
        $newW = max(1, (int) round($width * $scale));
        $newH = max(1, (int) round($height * $scale));
        $dst = imagecreatetruecolor($newW, $newH);

        if ($mime === 'image/png' || $mime === 'image/webp') {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
        }

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $width, $height);
        imagedestroy($src);

        ob_start();
        if ($mime === 'image/png') {
            imagepng($dst, null, 6);
        } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
            imagewebp($dst, null, 80);
        } else {
            imagejpeg($dst, null, 82);
            $mime = 'image/jpeg';
        }
        imagedestroy($dst);
        $out = ob_get_clean();

        if ($out === false || $out === '') {
            return null;
        }

        return [$out, $mime];
    }
}
