import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faTrashCan, faFilter, faPlus, faArrowLeft, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const emptyForm = {
    class_section_group_id: '',
    student_enrollment_id: '',
    installment_plan_id: '',
    total_amount: '',
    start_billing_month: currentMonth(),
};

export default function StudentInstallments({
    assignments = {},
    classSectionGroups = [],
    enrollments = [],
    installmentPlans = [],
    filterInstallmentPlanId = '',
    filterClassSectionGroupId = '',
    defaultBillingMonth = '',
}) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [generateMonth, setGenerateMonth] = useState(defaultBillingMonth || currentMonth());
    const [expandedId, setExpandedId] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm(emptyForm);

    const list = assignments?.data ?? (Array.isArray(assignments) ? assignments : []);
    const pagination = assignments?.links ? { links: assignments.links } : null;
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];

    const enrollmentsForGroup = useMemo(() => {
        const gid = data.class_section_group_id ? String(data.class_section_group_id) : '';
        if (!gid) return [];
        return (enrollments || []).filter((e) => String(e.class_section_group_id) === gid);
    }, [enrollments, data.class_section_group_id]);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const handleAssign = (e) => {
        e.preventDefault();
        post(route('student-installments.store'), {
            onSuccess: () => reset('class_section_group_id', 'student_enrollment_id', 'installment_plan_id', 'total_amount'),
        });
    };

    const handleRemove = (item) => {
        if (!window.confirm(`Remove installment plan "${item.installment_plan?.name}" from this student?`)) return;
        router.delete(route('student-installments.destroy', item.id), { preserveScroll: true });
    };

    const handleGenerate = () => {
        if (!generateMonth) return;
        if (!window.confirm(`Generate installment invoices for ${generateMonth}?`)) return;
        router.post(route('student-installments.generate'), { billing_month: generateMonth }, { preserveScroll: true });
    };

    const applyFilter = (key, value) => {
        const classSectionGroupId = key === 'class_section_group_id' ? value : filterClassSectionGroupId;
        const installmentPlanId = key === 'installment_plan_id' ? value : filterInstallmentPlanId;
        const params = {};
        if (classSectionGroupId) params.class_section_group_id = classSectionGroupId;
        if (installmentPlanId) params.installment_plan_id = installmentPlanId;
        router.get(route('student-installments.index'), params, { preserveState: true });
    };

    const onGroupChange = (groupId) => {
        setData('class_section_group_id', groupId);
        setData('student_enrollment_id', '');
    };

    const planLabel = (p) => (p ? `${p.name} (${p.number_of_installments})` : '—');

    return (
        <AuthenticatedLayout>
            <Head title="Student Installments" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg ${
                                banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                            role="alert"
                        >
                            {banner.message}
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Student Installments' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Installments</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Assign a plan + total amount. System splits into installments and can generate invoices per billing month.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.accountant-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 w-4 h-4" />
                                    Generate installment invoices
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Creates invoices for due schedules in the selected month (total ÷ number of installments).
                                </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing month</label>
                                    <input
                                        type="month"
                                        value={generateMonth}
                                        onChange={(e) => setGenerateMonth(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    Generate due invoices
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group</label>
                                <select
                                    value={filterClassSectionGroupId}
                                    onChange={(e) => applyFilter('class_section_group_id', e.target.value)}
                                    className="min-w-[280px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">All groups</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Installment plan</label>
                                <select
                                    value={filterInstallmentPlanId}
                                    onChange={(e) => applyFilter('installment_plan_id', e.target.value)}
                                    className="min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">All plans</option>
                                    {(installmentPlans || []).map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {planLabel(p)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faPlus} className="text-amber-500 w-4 h-4" />
                            Assign installment plan to student
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Total amount is split equally across installments starting from the start billing month.
                        </p>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="min-w-[280px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group</label>
                                    <select
                                        value={data.class_section_group_id}
                                        onChange={(e) => onGroupChange(e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                            errors.class_section_group_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select session · class · section</option>
                                        {groups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="min-w-[240px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Student (enrollment)</label>
                                    <select
                                        value={data.student_enrollment_id}
                                        onChange={(e) => setData('student_enrollment_id', e.target.value)}
                                        disabled={!data.class_section_group_id}
                                        className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                            errors.student_enrollment_id ? 'border-red-500' : 'border-gray-300'
                                        } disabled:bg-gray-100`}
                                    >
                                        <option value="">
                                            {data.class_section_group_id ? 'Select student' : 'Select group first'}
                                        </option>
                                        {enrollmentsForGroup.map((e) => (
                                            <option key={e.id} value={e.id}>
                                                {e.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.student_enrollment_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.student_enrollment_id}</p>
                                    )}
                                </div>
                                <div className="min-w-[180px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Installment plan</label>
                                    <select
                                        value={data.installment_plan_id}
                                        onChange={(e) => setData('installment_plan_id', e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                            errors.installment_plan_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select plan</option>
                                        {(installmentPlans || []).map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {planLabel(p)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.installment_plan_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.installment_plan_id}</p>
                                    )}
                                </div>
                                <div className="min-w-[120px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total amount</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={data.total_amount}
                                        onChange={(e) => setData('total_amount', e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                            errors.total_amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0"
                                    />
                                    {errors.total_amount && (
                                        <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>
                                    )}
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start month</label>
                                    <input
                                        type="month"
                                        value={data.start_billing_month}
                                        onChange={(e) => setData('start_billing_month', e.target.value)}
                                        className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                            errors.start_billing_month ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.start_billing_month && (
                                        <p className="text-red-500 text-sm mt-1">{errors.start_billing_month}</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={
                                        processing
                                        || !data.class_section_group_id
                                        || !data.student_enrollment_id
                                        || !data.installment_plan_id
                                        || data.total_amount === ''
                                        || !data.start_billing_month
                                    }
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    Assign
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {list.length} assignment{list.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                No assignments yet. Select class section group, then student, and assign a plan.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <React.Fragment key={item.id}>
                                                <tr>
                                                    <td className="px-6 py-4 text-gray-600">{item.session}</td>
                                                    <td className="px-6 py-4 text-gray-600">{item.class}</td>
                                                    <td className="px-6 py-4 text-gray-600">{item.section}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.enrollment_label}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                            {planLabel(item.installment_plan)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{item.start_billing_month || '—'}</td>
                                                    <td className="px-6 py-4 font-medium">{Number(item.total_amount)}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {item.invoiced_count ?? 0}/{item.schedule_count ?? 0} invoiced
                                                    </td>
                                                    <td className="px-6 py-4 space-x-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                                                        >
                                                            {expandedId === item.id ? 'Hide' : 'Schedule'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(item)}
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedId === item.id && (
                                                    <tr>
                                                        <td colSpan={9} className="px-6 py-3 bg-gray-50">
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-left text-gray-500">
                                                                            <th className="py-1 pr-4">#</th>
                                                                            <th className="py-1 pr-4">Billing month</th>
                                                                            <th className="py-1 pr-4">Due date</th>
                                                                            <th className="py-1 pr-4">Amount</th>
                                                                            <th className="py-1">Invoice</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {(item.schedules || []).map((s) => (
                                                                            <tr key={s.id} className="border-t border-gray-200">
                                                                                <td className="py-1.5 pr-4">{s.installment_no}</td>
                                                                                <td className="py-1.5 pr-4">{s.billing_month}</td>
                                                                                <td className="py-1.5 pr-4">{s.due_date || '—'}</td>
                                                                                <td className="py-1.5 pr-4">{Number(s.amount).toFixed(2)}</td>
                                                                                <td className="py-1.5">
                                                                                    {s.invoiced ? (
                                                                                        <Link
                                                                                            href={route('invoices.show', s.invoice_id)}
                                                                                            className="text-amber-600 hover:text-amber-700 font-medium"
                                                                                        >
                                                                                            {s.invoice_no || `#${s.invoice_id}`}
                                                                                        </Link>
                                                                                    ) : (
                                                                                        <span className="text-gray-500">Pending</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && pagination.links.length > 3 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
                                {pagination.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 rounded text-sm ${
                                            link.active
                                                ? 'bg-amber-500 text-white'
                                                : link.url
                                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {link.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
