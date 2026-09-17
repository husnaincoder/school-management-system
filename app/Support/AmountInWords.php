<?php

namespace App\Support;

class AmountInWords
{
    /**
     * Convert a money amount to English words (e.g. "Forty Thousand Only").
     */
    public static function convert(float|int|string $amount, string $currency = 'Rupees'): string
    {
        $amount = round((float) $amount, 2);
        $whole = (int) floor($amount);
        $fraction = (int) round(($amount - $whole) * 100);

        $words = trim(self::numberToWords($whole));
        if ($words === '') {
            $words = 'Zero';
        }

        $result = $currency.' '.$words;
        if ($fraction > 0) {
            $result .= ' and '.self::numberToWords($fraction).' Paisa';
        }

        return $result.' Only';
    }

    protected static function numberToWords(int $number): string
    {
        if ($number < 0) {
            return 'Minus '.self::numberToWords(abs($number));
        }

        $ones = [
            '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen',
        ];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if ($number < 20) {
            return $ones[$number];
        }
        if ($number < 100) {
            return trim($tens[(int) floor($number / 10)].' '.$ones[$number % 10]);
        }
        if ($number < 1000) {
            return trim($ones[(int) floor($number / 100)].' Hundred '.self::numberToWords($number % 100));
        }
        if ($number < 100000) {
            return trim(self::numberToWords((int) floor($number / 1000)).' Thousand '.self::numberToWords($number % 1000));
        }
        if ($number < 10000000) {
            return trim(self::numberToWords((int) floor($number / 100000)).' Lakh '.self::numberToWords($number % 100000));
        }

        return trim(self::numberToWords((int) floor($number / 10000000)).' Crore '.self::numberToWords($number % 10000000));
    }
}
