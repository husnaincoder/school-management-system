<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $student['name'] }} - Student Profile</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #222; margin: 0; padding: 0; }
        .header { border-bottom: 2px solid #1f2937; padding-bottom: 10px; margin-bottom: 12px; text-align: center; }
        .logo { max-height: 70px; max-width: 160px; display: block; margin: 0 auto 6px auto; }
        .school-title { font-size: 20px; font-weight: bold; color: #111827; margin: 0; }
        .school-meta { font-size: 9px; color: #4b5563; line-height: 1.5; margin-top: 4px; }
        .section-title {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-bottom: none;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 0.5px;
            padding: 6px 8px;
            text-transform: uppercase;
        }
        .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .detail-table td, .detail-table th { border: 1px solid #d1d5db; padding: 5px 7px; vertical-align: top; }
        .label { width: 28%; font-weight: bold; background: #fafafa; }
        .value { width: 32%; }
        .photo-box {
            width: 95px;
            height: 110px;
            border: 1px solid #9ca3af;
            text-align: center;
            font-size: 8px;
            color: #6b7280;
            margin-bottom: 6px;
            overflow: hidden;
        }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { padding-top: 42px; }
        .barcode-box {
            border: 1px solid #9ca3af;
            padding: 8px 6px;
            text-align: center;
            font-size: 8px;
            margin-top: 6px;
        }
        .barcode-lines {
            height: 28px;
            background: #111;
            background-image: linear-gradient(90deg, #111 0%, #111 10%, #fff 10%, #fff 12%, #111 12%, #111 22%, #fff 22%, #fff 24%, #111 24%, #111 34%, #fff 34%, #fff 36%, #111 36%, #111 46%, #fff 46%, #fff 48%, #111 48%, #111 58%, #fff 58%, #fff 60%, #111 60%, #111 70%, #fff 70%, #fff 72%, #111 72%, #111 82%, #fff 82%, #fff 84%, #111 84%, #111 100%);
            margin-bottom: 4px;
        }
        .side-photos td { border: none !important; padding: 0 0 0 8px !important; vertical-align: top; }
        .mini-photo {
            width: 72px;
            height: 82px;
            border: 1px solid #9ca3af;
            text-align: center;
            font-size: 7px;
            color: #6b7280;
            margin-bottom: 6px;
            overflow: hidden;
        }
        .mini-photo img { width: 100%; height: 100%; object-fit: cover; }
        .footer { margin-top: 10px; font-size: 8px; color: #9ca3af; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoSrc))
            <img src="{{ $logoSrc }}" class="logo" alt="Logo" />
        @endif
        <p class="school-title">{{ $schoolName }}</p>
        <div class="school-meta">
            <strong>Session:</strong> {{ $student['session'] }}
            · <strong>Generated:</strong> {{ now()->format('d M Y H:i') }}
        </div>
    </div>

    <div class="section-title">Student Details</div>
    <table class="detail-table">
        <tr>
            <td colspan="2" style="padding: 0; border-right: none;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td class="label">Name</td>
                        <td class="value">{{ $student['name'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Admission No</td>
                        <td class="value">{{ $student['admission_no'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Roll No.</td>
                        <td class="value">{{ $student['roll_no'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Class</td>
                        <td class="value">{{ $student['class'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Section</td>
                        <td class="value">{{ $student['section'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Group</td>
                        <td class="value">{{ $student['group'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Gender</td>
                        <td class="value">{{ $student['gender'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Admission Date</td>
                        <td class="value">{{ $student['admission_date'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Date Of Birth</td>
                        <td class="value">{{ $student['date_of_birth'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">CNIC / B-Form</td>
                        <td class="value">{{ $student['cnic'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Mobile Number</td>
                        <td class="value">{{ $student['mobile'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Email</td>
                        <td class="value">{{ $student['email'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">ID Card Number</td>
                        <td class="value">{{ $student['id_card_number'] }}</td>
                    </tr>
                </table>
            </td>
            <td class="side-photos" style="width: 120px; border-left: none;">
                <div class="photo-box">
                    @if(!empty($studentPhotoSrc))
                        <img src="{{ $studentPhotoSrc }}" alt="Student Photo" />
                    @else
                        <div class="photo-placeholder">Student Photo</div>
                    @endif
                </div>
                <div class="barcode-box">
                    <div class="barcode-lines"></div>
                    <div>{{ $student['admission_no'] }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section-title">Address</div>
    <table class="detail-table">
        <tr>
            <td class="label">Current Address</td>
            <td class="value" colspan="3">{{ $student['address'] }}</td>
        </tr>
        <tr>
            <td class="label">Permanent Address</td>
            <td class="value" colspan="3">
                {{ collect([$parent['address'], $parent['city'], $parent['state'], $parent['postal_code'], $parent['country']])->filter(fn ($v) => $v && $v !== '—')->implode(', ') ?: '—' }}
            </td>
        </tr>
    </table>

    <div class="section-title">Parent Guardian Detail</div>
    <table class="detail-table">
        <tr>
            <td colspan="2" style="padding: 0; border-right: none;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td class="label">Father Name</td>
                        <td class="value">{{ $parent['father_name'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Father Phone</td>
                        <td class="value">{{ $parent['father_phone'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Father Occupation</td>
                        <td class="value">{{ $parent['father_occupation'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Father CNIC</td>
                        <td class="value">{{ $parent['father_cnic'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Mother Name</td>
                        <td class="value">{{ $parent['mother_name'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Mother Phone</td>
                        <td class="value">{{ $parent['mother_phone'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Mother Occupation</td>
                        <td class="value">{{ $parent['mother_occupation'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Guardian Name</td>
                        <td class="value">{{ $parent['guardian_name'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Guardian Email</td>
                        <td class="value">{{ $parent['guardian_email'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Guardian Relation</td>
                        <td class="value">{{ $parent['guardian_relation'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Guardian Phone</td>
                        <td class="value">{{ $parent['guardian_phone'] }}</td>
                    </tr>
                    <tr>
                        <td class="label">Guardian Occupation</td>
                        <td class="value">{{ $parent['guardian_occupation'] }}</td>
                    </tr>
                </table>
            </td>
            <td class="side-photos" style="width: 120px; border-left: none;">
                <div class="mini-photo">
                    @if(!empty($parentPhotoSrc))
                        <img src="{{ $parentPhotoSrc }}" alt="Parent Photo" />
                    @else
                        <div class="photo-placeholder" style="padding-top: 30px;">Parent Photo</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">Printed from {{ $schoolName }} · {{ $student['name'] }} ({{ $student['admission_no'] }})</div>
</body>
</html>
