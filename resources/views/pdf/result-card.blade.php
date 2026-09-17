<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Result Card - {{ $exam->name ?? 'Exam' }}</title>
    <style>
        @page { margin: 8mm; size: A4 portrait; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #000;
            background: #fff;
        }

        .page {
            width: 100%;
            page-break-after: always;
        }
        .page:last-child { page-break-after: auto; }

        .frame {
            width: 100%;
            height: 275mm;
            position: relative;
            overflow: hidden;
            background: #fff;
        }
        .frame-border {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
        }
        .frame-inner {
            margin: 12px;
            padding: 14px 16px 10px;
            height: 251mm;
            position: relative;
            border: 1.5px solid #1a3a8c;
        }

        .content { position: relative; z-index: 1; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
        .header-table td { border: none; vertical-align: middle; padding: 0; }
        .header-brand { text-align: center; }
        .brand-inline {
            border-collapse: collapse;
            margin: 0 auto;
        }
        .brand-inline td { border: none; vertical-align: middle; padding: 0; }
        .brand-logo-cell {
            width: 102px;
            padding-right: 14px !important;
        }
        .brand-text-cell { text-align: left; }
        .logo {
            max-height: 96px;
            max-width: 100px;
            display: block;
        }
        .school-name {
            font-size: 30px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            text-align: left;
            line-height: 1.12;
            color: #000;
        }
        .school-address {
            font-size: 12px;
            text-align: left;
            margin-top: 5px;
            color: #111;
            line-height: 1.3;
        }
        .card-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin: 14px 0 12px;
            color: #000;
            text-decoration: underline;
        }

        .table-wrap {
            position: relative;
            margin-bottom: 12px;
            min-height: 140px;
        }
        .table-watermark {
            position: absolute;
            top: 20px;
            left: 50%;
            width: 240px;
            height: 240px;
            margin-left: -120px;
            opacity: 0.16;
            z-index: 0;
        }

        .info-box {
            border: 1.2px solid #000;
            border-radius: 8px;
            padding: 10px 12px 8px;
            margin-bottom: 12px;
        }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td {
            border: none;
            padding: 4px 3px;
            vertical-align: bottom;
            font-size: 11px;
        }
        .info-label {
            font-weight: bold;
            white-space: nowrap;
            width: 1%;
            padding-right: 6px;
        }
        .info-line {
            border-bottom: 1px solid #000;
            height: 18px;
            padding-left: 4px;
            font-weight: 600;
        }

        .marks-table {
            width: 100%;
            border-collapse: collapse;
            position: relative;
            z-index: 1;
            background: transparent;
        }
        .marks-table th,
        .marks-table td {
            border: 1px solid #000;
            padding: 7px 5px;
            text-align: center;
            font-size: 11px;
            height: 24px;
            background: transparent;
        }
        .marks-table th {
            background: rgba(239, 239, 239, 0.75);
            font-weight: bold;
            font-size: 10px;
        }
        .marks-table td.subject {
            text-align: left;
            padding-left: 8px;
            font-weight: 600;
        }
        .marks-table tr.total-row td {
            font-weight: bold;
            background: rgba(245, 245, 245, 0.7);
        }

        .bottom-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .bottom-table td {
            border: 1.2px solid #000;
            vertical-align: top;
            padding: 0;
        }
        .remarks-wrap {
            width: 52%;
            height: 56px;
            background: #c5daf0;
        }
        .remarks-inner {
            width: 100%;
            border-collapse: collapse;
            height: 56px;
        }
        .remarks-inner td { border: none; padding: 0; vertical-align: middle; }
        .remarks-vert {
            width: 22px;
            background: #a8c8e8;
            border-right: 1px solid #000;
            text-align: center;
            font-size: 7px;
            font-weight: bold;
            line-height: 1.05;
            padding: 2px 1px;
        }
        .remarks-text {
            padding: 6px 8px;
            font-size: 10px;
            min-height: 48px;
        }
        .metric {
            width: 16%;
            height: 56px;
            text-align: center;
            padding: 5px 3px !important;
        }
        .metric-label {
            display: block;
            font-size: 10px;
            font-weight: bold;
            text-align: left;
            padding-left: 5px;
            margin-bottom: 6px;
        }
        .metric-value {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-top: 4px;
        }

        .sign-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 28px;
        }
        .sign-table td {
            width: 33.33%;
            border: none;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            padding-top: 18px;
            vertical-align: bottom;
        }
        .sign-line {
            border-top: 1px solid #000;
            width: 78%;
            margin: 0 auto 6px;
        }
    </style>
</head>
<body>
@foreach($cards as $card)
    <div class="page">
        @include('pdf.partials.result-card-single', ['card' => $card])
    </div>
@endforeach
</body>
</html>
