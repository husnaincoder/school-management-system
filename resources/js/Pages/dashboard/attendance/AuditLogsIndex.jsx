import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faArrowLeft, faFilter } from '@fortawesome/free-solid-svg-icons';

function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const ACTION_STYLES = {
    created: 'bg-green-100 text-green-800',
    updated: 'bg-amber-100 text-amber-800',
    bulk_updated: 'bg-orange-100 text-orange-800',
};

export default function AuditLogsIndex({
    logs,
    filters = {},
    actionOptions = [],
    typeOptions = [],
}) {
    const data = logs?.data ?? [];
    const pagination = logs?.links ? logs : null;

    const applyFilters = (patch) => {
        const next = {
            action: filters.action || undefined,
            auditable_type: filters.auditable_type || undefined,
            ...patch,
        };
        Object.keys(next).forEach((k) => {
            if (!next[k]) delete next[k];
        });
        router.get(route('attendance.audit-logs.index'), next, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Attendance Audit Logs" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Attendance Management', href: route('admin.attendance-management') },
                            { label: 'Audit Logs' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClipboardList} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance Audit Logs</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Track who changed attendance records and what was updated.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.attendance-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                                <select
                                    className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filters.action || ''}
                                    onChange={(e) => applyFilters({ action: e.target.value || undefined })}
                                >
                                    <option value="">All</option>
                                    {actionOptions.map((a) => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                <select
                                    className="min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filters.auditable_type || ''}
                                    onChange={(e) => applyFilters({ auditable_type: e.target.value || undefined })}
                                >
                                    <option value="">All</option>
                                    {typeOptions.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date / Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in / Out</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                No audit logs found. Changes appear here after attendance is marked or updated.
                                            </td>
                                        </tr>
                                    ) : data.map((log) => (
                                        <tr key={log.id}>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.user_name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{log.auditable_type_label}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">#{log.auditable_id}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-700'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {log.old_status || log.new_status ? (
                                                    <span>
                                                        {log.old_status ? <span className="text-gray-400">{log.old_status}</span> : '—'}
                                                        {' → '}
                                                        <span className="font-medium">{log.new_status || '—'}</span>
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                {(log.old_check_in || log.new_check_in || log.old_check_out || log.new_check_out) ? (
                                                    <div className="text-xs space-y-0.5">
                                                        <div>In: {log.old_check_in || '—'} → {log.new_check_in || '—'}</div>
                                                        <div>Out: {log.old_check_out || '—'} → {log.new_check_out || '—'}</div>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400">{log.ip_address || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && pagination.links.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-1">
                                {pagination.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`min-w-[2.25rem] px-2 py-1.5 rounded text-sm font-medium ${
                                            link.active
                                                ? 'bg-amber-500 text-white'
                                                : link.url
                                                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
