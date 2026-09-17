<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Fee Slips</title>
    <style>
        @page { margin: 8mm 6mm; }
        * { margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #111; }
        .page-block { page-break-after: always; }
        .page-block:last-child { page-break-after: auto; }
        .wrap { width: 100%; }
        .wrap td.voucher-cell { width: 50%; vertical-align: top; padding: 0 6px; }
        .voucher { padding: 4px 2px; }
        .copy-label { text-align: center; font-size: 7px; font-weight: bold; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
        .logo-wrap { text-align: center; margin-bottom: 4px; }
        .logo { height: 52px; }
        .bar { background: #dbe4ee; text-align: center; padding: 5px 4px; margin: 0 0 8px 0; }
        .bar-title { font-size: 12px; font-weight: bold; color: #1d4ed8; }
        .bar-sub { font-size: 11px; font-weight: bold; color: #1d4ed8; }
        .info { width: 100%; margin-bottom: 8px; }
        .info td { padding: 1px 0; font-size: 9px; vertical-align: top; }
        .info .label { width: 78px; font-weight: bold; color: #111; }
        .info .value { font-weight: bold; color: #111; }
        .fees { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .fees th, .fees td { border: 1px dotted #60a5fa; padding: 4px 5px; font-size: 8px; }
        .fees th { background: #bbf7d0; color: #15803d; font-weight: bold; text-align: center; }
        .fees .type { text-align: left; width: 50%; }
        .fees .num { text-align: center; width: 25%; }
        .fees .total td { font-weight: bold; }
        .dates { font-size: 9px; font-weight: bold; margin: 3px 0; color: #111; }
        .note { font-size: 7.5px; color: #111; margin: 6px 0 10px; line-height: 1.35; }
        .sig { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .sig td { font-size: 9px; padding-top: 8px; vertical-align: bottom; }
        .sig .lbl { width: 58px; font-weight: bold; }
        .sig .line { border-bottom: 1px solid #111; }
    </style>
</head>
<body>
@foreach ($pages as $page)
    <div class="page-block">
        @include('pdf.partials.fee-voucher-page', $page)
    </div>
@endforeach
</body>
</html>
