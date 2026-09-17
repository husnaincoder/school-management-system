import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import SearchableMultiSelect from '@/Components/Dashboard/SearchableMultiSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const money = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function InvoiceCreate({
    classSectionGroups = [],
    enrollments = [],
    feeStructures = [],
    billingMonth = '',
}) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const allEnrollments = Array.isArray(enrollments) ? enrollments : [];
    const allFeeStructures = Array.isArray(feeStructures) ? feeStructures : [];
    const { data, setData, processing, errors } = useForm({
        class_section_group_id: '',
        student_enrollment_ids: [],
        billing_month: billingMonth || currentMonth(),
        issue_date: '',
        due_date: '',
        fine_amount: '',
    });

    useEffect(() => {
        if (billingMonth && billingMonth !== data.billing_month) {
            setData('billing_month', billingMonth);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billingMonth]);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const enrollmentsForGroup = useMemo(() => {
        const gid = data.class_section_group_id ? String(data.class_section_group_id) : '';
        if (!gid) return [];
        return allEnrollments.filter((e) => String(e.class_section_group_id) === gid);
    }, [allEnrollments, data.class_section_group_id]);

    const groupFeeLines = useMemo(() => {
        const gid = data.class_section_group_id ? String(data.class_section_group_id) : '';
        if (!gid) return [];
        return allFeeStructures.filter((f) => String(f.class_section_group_id) === gid);
    }, [allFeeStructures, data.class_section_group_id]);

    const groupOptions = useMemo(
        () =>
            groups.map((g) => ({
                value: g.id,
                label: g.name,
                searchText: g.name,
                selectedLabel: g.name,
            })),
        [groups]
    );

    const studentOptions = useMemo(
        () =>
            enrollmentsForGroup.map((e) => ({
                value: e.id,
                label: e.name,
                searchText: e.name,
                selectedLabel: e.name,
            })),
        [enrollmentsForGroup]
    );

    const selectedIds = Array.isArray(data.student_enrollment_ids) ? data.student_enrollment_ids : [];

    const selectedQuotes = useMemo(() => {
        const idSet = new Set(selectedIds.map(String));
        return enrollmentsForGroup
            .filter((e) => idSet.has(String(e.id)))
            .map((e) => ({
                id: e.id,
                name: e.name,
                overtime_total: e.overtime_total ?? 0,
                previous_balance_total: e.previous_balance_total ?? e.quote?.previous_balance_total ?? 0,
                quote: e.quote || {
                    lines: [],
                    subtotal: 0,
                    scholarship_discount: 0,
                    sibling_discount: 0,
                    discount_amount: 0,
                    payable: 0,
                    previous_balance_total: 0,
                    scholarships: [],
                },
            }));
    }, [enrollmentsForGroup, selectedIds]);

    const summary = useMemo(() => {
        return selectedQuotes.reduce(
            (acc, row) => {
                acc.subtotal += Number(row.quote.subtotal || 0);
                acc.discount += Number(row.quote.discount_amount || 0);
                acc.payable += Number(row.quote.payable || 0);
                return acc;
            },
            { subtotal: 0, discount: 0, payable: 0 }
        );
    }, [selectedQuotes]);

    const onGroupChange = (groupId) => {
        setData({
            ...data,
            class_section_group_id: groupId,
            student_enrollment_ids: [],
        });
    };

    const onBillingMonthChange = (month) => {
        setData('billing_month', month);
        router.get(
            route('invoices.create'),
            { billing_month: month },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['enrollments', 'billingMonth'],
            }
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('invoices.store'), {
            student_enrollment_ids: selectedIds,
            billing_month: data.billing_month,
            issue_date: data.issue_date,
            due_date: data.due_date,
            fine_amount: data.fine_amount || 0,
        });
    };

    const selectedCount = selectedIds.length;
    const hasFees = selectedQuotes.some((q) => Number(q.quote.subtotal || 0) > 0);
    const canSubmit = selectedCount > 0 && data.issue_date && data.due_date && hasFees;

    return (
        <AuthenticatedLayout>
            <Head title="Create Invoice" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-2 rounded ${
                                banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Invoices', href: route('invoices.index') },
                            { label: 'New Invoice' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Fees + overtime for the billing month. Unpaid previous balances are added automatically. Scholarships and sibling discounts apply on base fees only.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('invoices.index')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Billing month</label>
                                    <input
                                        type="month"
                                        value={data.billing_month}
                                        onChange={(e) => onBillingMonthChange(e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 ${errors.billing_month ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Overtime is for this month only. Any unpaid balance from earlier months is added as Previous Balance.
                                    </p>
                                    {errors.billing_month && <p className="text-red-500 text-sm mt-1">{errors.billing_month}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group</label>
                                    <SearchableSelect
                                        options={groupOptions}
                                        value={data.class_section_group_id}
                                        onChange={onGroupChange}
                                        placeholder="Search session, class, section or group..."
                                        inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        emptyText="No class section group found"
                                    />
                                </div>
                            </div>

                            {data.class_section_group_id && (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Class Fee Structure</h3>
                                    {groupFeeLines.length === 0 ? (
                                        <p className="text-sm text-amber-700">
                                            No fee types set for this group. Add them under Accountant → Class Fee Structures.
                                        </p>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500 border-b border-gray-200">
                                                    <th className="py-1.5 font-medium">Fee Type</th>
                                                    <th className="py-1.5 font-medium text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupFeeLines.map((line) => (
                                                    <tr key={line.id} className="border-b border-gray-100 last:border-0">
                                                        <td className="py-1.5 text-gray-800">{line.fee_type_name}</td>
                                                        <td className="py-1.5 text-right text-gray-800">{money(line.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td className="pt-2 font-semibold text-gray-900">Subtotal (per student base)</td>
                                                    <td className="pt-2 text-right font-semibold text-gray-900">
                                                        {money(groupFeeLines.reduce((s, l) => s + Number(l.amount || 0), 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Students (enrollment)
                                    {selectedCount > 0 && (
                                        <span className="ml-2 text-amber-600 font-normal">{selectedCount} selected</span>
                                    )}
                                </label>
                                <SearchableMultiSelect
                                    options={studentOptions}
                                    value={selectedIds}
                                    onChange={(ids) => setData('student_enrollment_ids', ids)}
                                    placeholder={
                                        data.class_section_group_id
                                            ? 'Search and select students...'
                                            : 'Select group first'
                                    }
                                    disabled={!data.class_section_group_id}
                                    disabledText="Select group first"
                                    emptyText={
                                        enrollmentsForGroup.length === 0
                                            ? 'No students found in this group.'
                                            : 'No matching students'
                                    }
                                    inputClassName={errors.student_enrollment_ids ? 'border-red-500' : ''}
                                />
                                {errors.student_enrollment_ids && (
                                    <p className="text-red-500 text-sm mt-1">{errors.student_enrollment_ids}</p>
                                )}
                            </div>

                            {selectedQuotes.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Invoice preview (fees + overtime + previous balance for {data.billing_month} + discounts)
                                    </h3>
                                    {selectedQuotes.map((row) => {
                                        const q = row.quote;
                                        const overtimeTotal = Number(row.overtime_total || 0);
                                        const previousBalanceTotal = Number(
                                            row.previous_balance_total || q.previous_balance_total || 0
                                        );
                                        return (
                                            <div key={row.id} className="rounded-lg border border-gray-200 p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{row.name}</p>
                                                        {q.scholarships?.length > 0 ? (
                                                            <p className="text-xs text-blue-700 mt-0.5">
                                                                Scholarship:{' '}
                                                                {q.scholarships.map((s) => s.label).join(', ')}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 mt-0.5">No scholarship assigned</p>
                                                        )}
                                                        {Number(q.sibling_discount) > 0 ? (
                                                            <p className="text-xs text-emerald-700 mt-0.5">
                                                                {q.sibling_discount_label || `Sibling discount ${Number(q.sibling_discount_percentage || 0)}%`}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {q.sibling_discount_label || 'No sibling discount'}
                                                            </p>
                                                        )}
                                                        {overtimeTotal > 0 ? (
                                                            <p className="text-xs text-violet-700 mt-0.5">
                                                                Overtime in {data.billing_month}: {money(overtimeTotal)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                No overtime charges in {data.billing_month}
                                                            </p>
                                                        )}
                                                        {previousBalanceTotal > 0 ? (
                                                            <p className="text-xs text-rose-700 mt-0.5">
                                                                Previous balance: {money(previousBalanceTotal)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                No previous unpaid balance
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <div className="text-gray-600">Payable</div>
                                                        <div className="text-lg font-semibold text-amber-600">{money(q.payable)}</div>
                                                    </div>
                                                </div>
                                                {(q.lines || []).length === 0 ? (
                                                    <p className="text-sm text-amber-700">No fee lines for this student.</p>
                                                ) : (
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-left text-gray-500 border-b border-gray-100">
                                                                <th className="py-1 font-medium">Fee</th>
                                                                <th className="py-1 font-medium text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {q.lines.map((line, idx) => {
                                                                const lineClass =
                                                                    line.source === 'overtime'
                                                                        ? 'text-violet-700'
                                                                        : line.source === 'previous_balance'
                                                                          ? 'text-rose-700'
                                                                          : 'text-gray-800';
                                                                return (
                                                                    <tr key={`${row.id}-${idx}`}>
                                                                        <td className={`py-1 ${lineClass}`}>
                                                                            {line.description || line.fee_type_name || 'Fee'}
                                                                        </td>
                                                                        <td className={`py-1 text-right ${lineClass}`}>
                                                                            {money(line.amount)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t border-gray-100">
                                                                <td className="pt-1.5 text-gray-600">Subtotal</td>
                                                                <td className="pt-1.5 text-right">{money(q.subtotal)}</td>
                                                            </tr>
                                                            {Number(q.scholarship_discount) > 0 && (
                                                                <tr>
                                                                    <td className="text-blue-700">Scholarship discount</td>
                                                                    <td className="text-right text-blue-700">
                                                                        -{money(q.scholarship_discount)}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            {Number(q.sibling_discount) > 0 && (
                                                                <tr>
                                                                    <td className="text-emerald-700">
                                                                        Sibling discount
                                                                        {Number(q.sibling_discount_percentage) > 0
                                                                            ? ` (${Number(q.sibling_discount_percentage)}%)`
                                                                            : ''}
                                                                    </td>
                                                                    <td className="text-right text-emerald-700">
                                                                        -{money(q.sibling_discount)}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            <tr>
                                                                <td className="pt-1 font-semibold">Net payable</td>
                                                                <td className="pt-1 text-right font-semibold">{money(q.payable)}</td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {selectedQuotes.length > 1 && (
                                        <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
                                            Combined: Subtotal {money(summary.subtotal)} · Discount{' '}
                                            {money(summary.discount)} · Payable {money(summary.payable)}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue date</label>
                                    <input
                                        type="date"
                                        value={data.issue_date}
                                        onChange={(e) => setData('issue_date', e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 ${errors.issue_date ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.issue_date && <p className="text-red-500 text-sm mt-1">{errors.issue_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Due date</label>
                                    <input
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 ${errors.due_date ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fine amount (optional)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={data.fine_amount}
                                    onChange={(e) => setData('fine_amount', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !canSubmit}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                                >
                                    {selectedCount > 1 ? `Create ${selectedCount} Invoices` : 'Create Invoice'}
                                </button>
                                <a
                                    href={route('invoices.index')}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
                                >
                                    Cancel
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
