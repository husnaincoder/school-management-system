import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faPen, faTrashCan, faBell, faFilter, faThumbtack, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const priorityClass = (p) => {
    const map = { low: 'bg-gray-100 text-gray-800', medium: 'bg-blue-100 text-blue-800', high: 'bg-amber-100 text-amber-800', urgent: 'bg-red-100 text-red-800' };
    return map[p] || 'bg-gray-100 text-gray-800';
};

export default function NoticesIndex({ notices = [], categories = [], filters = {}, canCreate = true }) {
    const { flash } = usePage().props;
    const list = Array.isArray(notices) ? notices : [];
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [pinnedOnly, setPinnedOnly] = useState(filters.pinned || false);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const applyFilters = () => {
        router.get(route('notices.index'), { category_id: categoryId || undefined, pinned: pinnedOnly || undefined }, { preserveState: true });
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete notice "${item.title}"?`)) return;
        router.delete(route('notices.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notices" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Notice Management', href: route('admin.notice-management') },
                            { label: 'Notices' },
                        ]}
                    />

                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faBell} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
                                <p className="text-sm text-gray-500 mt-0.5">View and manage notices.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.notice-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            {canCreate && (
                                <Link href={route('notices.create')} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium text-sm transition-colors">
                                    <FontAwesomeIcon icon={faPlus} /> Add Notice
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FontAwesomeIcon icon={faFilter} className="text-amber-500" /> Filters</h2>
                        <div className="flex flex-wrap gap-3 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
                                    <option value="">All</option>
                                    {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="pinned" checked={pinnedOnly} onChange={(e) => setPinnedOnly(e.target.checked)} className="rounded border-gray-300" />
                                <label htmlFor="pinned" className="text-sm">Pinned only</label>
                            </div>
                            <button type="button" onClick={applyFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">Apply</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pinned</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Publish / Expire</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <p className="text-gray-500 mb-4">No notices found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((n) => (
                                        <tr key={n.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{n.title}</td>
                                            <td className="px-6 py-4 text-gray-600">{n.category?.name || '—'}</td>
                                            <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityClass(n.priority)}`}>{n.priority}</span></td>
                                            <td className="px-6 py-4">{n.is_pinned ? <FontAwesomeIcon icon={faThumbtack} className="text-amber-500" /> : '—'}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{n.publish_at ? new Date(n.publish_at).toLocaleDateString() : '—'} / {n.expire_at ? new Date(n.expire_at).toLocaleDateString() : '—'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={route('notices.show', n.id)} className="text-indigo-600 hover:text-indigo-700 mr-3" title="View"><FontAwesomeIcon icon={faEye} /></a>
                                                {n.can_edit && (
                                                    <>
                                                        <a href={route('notices.edit', n.id)} className="text-blue-600 hover:text-blue-700 mr-3" title="Edit"><FontAwesomeIcon icon={faPen} /></a>
                                                        <button type="button" onClick={() => handleDelete(n)} className="text-red-600 hover:text-red-700" title="Delete"><FontAwesomeIcon icon={faTrashCan} /></button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
