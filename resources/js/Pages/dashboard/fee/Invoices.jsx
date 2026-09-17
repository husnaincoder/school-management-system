import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faFilter, faPlus, faEye, faFilePdf, faFileExcel, faArrowLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons';

const STATUS_LABELS = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

export default function InvoicesIndex({
    invoices = {},
    classSectionGroups = [],
    filterStatus = '',
    filterClassSectionGroupId = '',
}) {
    const { flash } = usePage().props;
    const list = invoices?.data ?? (Array.isArray(invoices) ? invoices : []);
    const pagination = invoices?.links ? { links: invoices.links } : null;
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const feeSlipsOpenedRef = useRef(false);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    // After bulk create: auto-download one PDF with all students' fee slips
    useEffect(() => {
        const ids = Array.isArray(flash?.download_invoice_ids) ? flash.download_invoice_ids : [];
        if (ids.length === 0 || feeSlipsOpenedRef.current) return;
        feeSlipsOpenedRef.current = true;
        const q = new URLSearchParams();
        ids.forEach((id) => q.append('ids[]', String(id)));
        const url = `${route('invoices.fee-slips')}?${q.toString()}`;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        const t = setTimeout(() => {
            iframe.remove();
        }, 60000);
        return () => {
            clearTimeout(t);
            iframe.remove();
        };
    }, [flash?.download_invoice_ids]);

    const applyFilter = (key, value) => {
        const status = key === 'status' ? value : filterStatus;
        const groupId = key === 'class_section_group_id' ? value : filterClassSectionGroupId;
        const params = {};
        if (status) params.status = status;
        if (groupId) params.class_section_group_id = groupId;
        router.get(route('invoices.index'), params, { preserveState: true });
    };

    const exportQuery = (forSelectedOnly = false) => {
        const q = new URLSearchParams();
        if (forSelectedOnly && selectedIds.size > 0) {
            selectedIds.forEach((id) => q.append('ids[]', id));
        } else {
            if (filterStatus) q.set('status', filterStatus);
            if (filterClassSectionGroupId) q.set('class_section_group_id', filterClassSectionGroupId);
            q.set('billing_month', new Date().toISOString().slice(0, 7));
        }
        return q.toString();
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size >= list.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(list.map((inv) => inv.id)));
    };

    const handleDelete = (inv) => {
        if (!window.confirm(`Delete invoice ${inv.invoice_no}? This cannot be undone easily.`)) return;
        router.delete(route('invoices.destroy', inv.id), { preserveScroll: true });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Delete ${selectedIds.size} selected invoice(s)?`)) return;
        router.delete(route('invoices.destroy-bulk'), {
            data: { ids: Array.from(selectedIds) },
            preserveScroll: true,
            onSuccess: () => setSelectedIds(new Set()),
        });
    };

    const hasSelection = selectedIds.size > 0;
    const allSelected = list.length > 0 && selectedIds.size === list.length;
    const someSelected = selectedIds.size > 0;
    const headerCheckRef = useRef(null);
    useEffect(() => {
        if (headerCheckRef.current) {
            headerCheckRef.current.indeterminate = someSelected && !allSelected;
        }
    }, [someSelected, allSelected]);

    return (
        <AuthenticatedLayout>
            <Head title="Invoices" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Invoices' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Create and view fee invoices for students.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.accountant-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <a href={hasSelection ? `${route('invoices.export.pdf')}?${exportQuery(true)}` : `${route('invoices.export.pdf')}?${exportQuery()}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                                <FontAwesomeIcon icon={faFilePdf} /> Export PDF {hasSelection && `(${selectedIds.size})`}
                            </a>
                            <a href={hasSelection ? `${route('invoices.export.excel')}?${exportQuery(true)}` : `${route('invoices.export.excel')}?${exportQuery()}`} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                                <FontAwesomeIcon icon={faFileExcel} /> Export Excel {hasSelection && `(${selectedIds.size})`}
                            </a>
                            {hasSelection && (
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                >
                                    <FontAwesomeIcon icon={faTrashCan} /> Delete ({selectedIds.size})
                                </button>
                            )}
                            <a href={route('invoices.create')} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <FontAwesomeIcon icon={faPlus} /> New Invoice
                            </a>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" /> Filters
                        </h2>
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select value={filterStatus} onChange={(e) => applyFilter('status', e.target.value)} className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                    <option value="">All</option>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group</label>
                                <select value={filterClassSectionGroupId} onChange={(e) => applyFilter('class_section_group_id', e.target.value)} className="min-w-[260px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                                    <option value="">All groups</option>
                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{list.length} invoice(s)</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input ref={headerCheckRef} type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                                                <span className="text-xs font-medium text-gray-500 uppercase">Select</span>
                                            </label>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue / Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-8 text-center text-gray-500">No invoices yet. Create one from the button above.</td>
                                        </tr>
                                    ) : (
                                        list.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="px-4 py-4">
                                                    <input type="checkbox" checked={selectedIds.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                                                </td>
                                                <td className="px-6 py-4 font-mono text-sm text-gray-900">{inv.invoice_no}</td>
                                                <td className="px-6 py-4 text-gray-600">{inv.session}</td>
                                                <td className="px-6 py-4 text-gray-600">{inv.class}</td>
                                                <td className="px-6 py-4 text-gray-600">{inv.section}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{inv.enrollment_label}</td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">{inv.issue_date} / {inv.due_date}</td>
                                                <td className="px-6 py-4">{Number(inv.total_amount)}</td>
                                                <td className="px-6 py-4 font-medium">{Number(inv.balance)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                                        {STATUS_LABELS[inv.status] || inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <a href={route('invoices.show', inv.id)} className="text-amber-500 hover:text-amber-600 mr-3" title="View">
                                                        <FontAwesomeIcon icon={faEye} className="text-sm" />
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(inv)}
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Delete"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && pagination.links.length > 3 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2">
                                {pagination.links.map((link, i) => (
                                    <button key={i} type="button" onClick={() => link.url && router.get(link.url)} disabled={!link.url}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-amber-500 text-white' : link.url ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}>
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
