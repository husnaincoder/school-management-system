{{-- One landscape page: School copy + Student copy --}}
@php
    $copies = ['For School', 'For Student'];
@endphp

<table class="wrap" cellspacing="0" cellpadding="0">
    <tr>
        @foreach ($copies as $copyLabel)
            <td class="voucher-cell">
                <div class="voucher">
                    <div class="copy-label">{{ $copyLabel }}</div>

                    <div class="logo-wrap">
                        @if (! empty($logoPath))
                            <img src="{{ $logoPath }}" class="logo" alt="Logo" />
                        @endif
                    </div>

                    <div class="bar">
                        <div class="bar-title">{{ $schoolName }}</div>
                    </div>

                    <table class="info" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="label">Name:</td>
                            <td class="value">{{ $studentName }}</td>
                        </tr>
                        <tr>
                            <td class="label">S/D/O:</td>
                            <td class="value">{{ $parentName }}</td>
                        </tr>
                        <tr>
                            <td class="label">Class:</td>
                            <td class="value">{{ $class }}</td>
                        </tr>
                        <tr>
                            <td class="label">Section:</td>
                            <td class="value">{{ $section }}</td>
                        </tr>
                        <tr>
                            <td class="label">Admission No:</td>
                            <td class="value">{{ $admissionNo }}</td>
                        </tr>
                        <tr>
                            <td class="label">Due Month:</td>
                            <td class="value">{{ $dueMonth }}</td>
                        </tr>
                    </table>

                    <div class="bar">
                        <div class="bar-sub">Fee Voucher</div>
                    </div>

                    <table class="fees" cellspacing="0" cellpadding="0">
                        <thead>
                            <tr>
                                <th class="type">Fee Type</th>
                                <th class="num">Paid</th>
                                <th class="num">Due Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($invoice->items as $item)
                                <tr>
                                    <td class="type">
                                        {{ $item->feeType?->name ?? ($item->description ?: 'Fee') }}
                                    </td>
                                    <td class="num"></td>
                                    <td class="num">{{ number_format((float) $item->amount, 0) }}</td>
                                </tr>
                            @endforeach

                            @if ((float) $invoice->discount_amount > 0)
                                <tr>
                                    <td class="type">Discount</td>
                                    <td class="num"></td>
                                    <td class="num">-{{ number_format((float) $invoice->discount_amount, 0) }}</td>
                                </tr>
                            @endif

                            @if ((float) $invoice->fine_amount > 0)
                                <tr>
                                    <td class="type">Fine</td>
                                    <td class="num"></td>
                                    <td class="num">{{ number_format((float) $invoice->fine_amount, 0) }}</td>
                                </tr>
                            @endif

                            <tr class="total">
                                <td class="type">Total:</td>
                                <td class="num">
                                    @if ((float) $invoice->paid_amount > 0)
                                        {{ number_format((float) $invoice->paid_amount, 0) }}
                                    @endif
                                </td>
                                <td class="num">{{ number_format((float) $invoice->balance, 0) }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="dates">Due Date: {{ $dueDate }}</div>
                    <div class="dates">Valid till: {{ $validTill }}</div>

                    <div class="note">
                        Note: Monthly fee must be paid before the due date. After the due date the fine will be charged.
                    </div>

                    <table class="sig" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="lbl">Signature:</td>
                            <td class="line">&nbsp;</td>
                        </tr>
                        <tr>
                            <td class="lbl">Stamp:</td>
                            <td>&nbsp;</td>
                        </tr>
                    </table>
                </div>
            </td>
        @endforeach
    </tr>
</table>
