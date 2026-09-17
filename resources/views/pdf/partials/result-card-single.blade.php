@php
    $vertLetters = ['O', 'v', 'e', 'r', '-', 'A', 'l', 'l', '', 'R', 'e', 'm', 'a', 'r', 'k', 's'];
    $borderSvg = 'data:image/svg+xml;base64,' . base64_encode(<<<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560" preserveAspectRatio="none">
  <defs>
    <pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M10 1 C14 4 16 8 10 12 C4 8 6 4 10 1 Z" fill="none" stroke="#1a3a8c" stroke-width="1.1"/>
      <circle cx="10" cy="10" r="1.2" fill="#1a3a8c"/>
    </pattern>
  </defs>
  <rect x="2" y="2" width="396" height="556" fill="none" stroke="#1a3a8c" stroke-width="10"/>
  <rect x="8" y="8" width="384" height="544" fill="none" stroke="url(#p)" stroke-width="8"/>
  <rect x="14" y="14" width="372" height="532" fill="none" stroke="#1a3a8c" stroke-width="1.5"/>
  <g fill="none" stroke="#1a3a8c" stroke-width="1.4">
    <path d="M18 40 Q18 18 40 18"/>
    <path d="M28 40 Q28 28 40 28"/>
    <circle cx="22" cy="22" r="2.2" fill="#1a3a8c"/>
    <path d="M382 40 Q382 18 360 18"/>
    <path d="M372 40 Q372 28 360 28"/>
    <circle cx="378" cy="22" r="2.2" fill="#1a3a8c"/>
    <path d="M18 520 Q18 542 40 542"/>
    <path d="M28 520 Q28 532 40 532"/>
    <circle cx="22" cy="538" r="2.2" fill="#1a3a8c"/>
    <path d="M382 520 Q382 542 360 542"/>
    <path d="M372 520 Q372 532 360 532"/>
    <circle cx="378" cy="538" r="2.2" fill="#1a3a8c"/>
  </g>
</svg>
SVG);
@endphp
<div class="frame">
    <img src="{{ $borderSvg }}" class="frame-border" alt="" />

    <div class="frame-inner">
        <div class="content">
            {{-- Logo + school name as one header group (like the printed card) --}}
            <table class="header-table">
                <tr>
                    <td class="header-brand">
                        <table class="brand-inline">
                            <tr>
                                @if(!empty($logoSrc))
                                    <td class="brand-logo-cell">
                                        <img src="{{ $logoSrc }}" class="logo" alt="Logo" />
                                    </td>
                                @endif
                                <td class="brand-text-cell">
                                    <div class="school-name">{{ $schoolName }}</div>
                                    @if(!empty($schoolAddress))
                                        <div class="school-address">{{ $schoolAddress }}</div>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <div class="card-title">{{ $cardTitle }}</div>

            <div class="info-box">
                <table class="info-table">
                    <tr>
                        <td class="info-label">Student's Name:</td>
                        <td class="info-line" colspan="3">{{ $card['student_name'] }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Father's Name:</td>
                        <td class="info-line" colspan="3">{{ $card['father_name'] }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Class:</td>
                        <td class="info-line">{{ $card['class_name'] }}</td>
                        <td class="info-label" style="padding-left: 10px;">Section:</td>
                        <td class="info-line">{{ $card['section_name'] }}</td>
                    </tr>
                </table>
            </div>

            {{-- Marks table with light logo shadow behind it --}}
            <div class="table-wrap">
                @if(!empty($logoSrc))
                    <img src="{{ $logoSrc }}" class="table-watermark" alt="" />
                @endif
                <table class="marks-table">
                    <thead>
                        <tr>
                            <th style="width: 9%;">Sr. #</th>
                            <th style="width: 27%;">Subjects</th>
                            <th style="width: 16%;">Maximum Marks</th>
                            <th style="width: 16%;">Obtained Marks</th>
                            <th style="width: 12%;">%age</th>
                            <th style="width: 20%;">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($card['subjects'] as $index => $subject)
                            <tr>
                                <td>{{ $subject['name'] !== '' ? ($index + 1) : '' }}</td>
                                <td class="subject">{{ $subject['name'] }}</td>
                                <td>{{ $subject['max_marks'] }}</td>
                                <td>{{ $subject['obtained'] }}</td>
                                <td>{{ $subject['percentage'] }}</td>
                                <td>{{ $subject['remarks'] }}</td>
                            </tr>
                        @endforeach
                        <tr class="total-row">
                            <td colspan="2">TOTAL</td>
                            <td>{{ $card['total_max'] }}</td>
                            <td>{{ $card['total_obtained'] }}</td>
                            <td>{{ $card['percentage'] }}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <table class="bottom-table">
                <tr>
                    <td class="remarks-wrap">
                        <table class="remarks-inner">
                            <tr>
                                <td class="remarks-vert">
                                    @foreach($vertLetters as $letter)
                                        <div style="height: 7px;">{{ $letter }}</div>
                                    @endforeach
                                </td>
                                {{-- Keep blue remarks area empty (handwritten / stamp space) --}}
                                <td class="remarks-text">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                    <td class="metric">
                        <span class="metric-label">Grade:</span>
                        <div class="metric-value">{{ $card['grade'] !== '—' ? $card['grade'] : '' }}</div>
                    </td>
                    <td class="metric">
                        <span class="metric-label">Position:</span>
                        <div class="metric-value">{{ $card['position'] !== '—' ? $card['position'] : '' }}</div>
                    </td>
                    <td class="metric">
                        <span class="metric-label">Status:</span>
                        <div class="metric-value">{{ $card['status'] !== '—' ? $card['status'] : '' }}</div>
                    </td>
                </tr>
            </table>

            <table class="sign-table">
                <tr>
                    <td>
                        <div class="sign-line"></div>
                        Class Incharge
                    </td>
                    <td>
                        <div class="sign-line"></div>
                        Principal's Sign.
                    </td>
                    <td>
                        <div class="sign-line"></div>
                        Result Date
                    </td>
                </tr>
            </table>
        </div>
    </div>
</div>
