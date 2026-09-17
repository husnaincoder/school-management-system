import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCalendarAlt, faTrashCan, faPen, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';

const initialForm = { name: '', start_date: '', end_date: '', is_active: false, is_current: false };

export default function SessionsIndex({ sessions = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [activeOnly, setActiveOnly] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const { data, setData, post, put, processing, errors, reset } = useForm(initialForm);
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const openAddModal = () => {
        setEditingSession(null);
        setData(initialForm);
        reset();
        setShowModal(true);
    };

    const openEditModal = (session) => {
        setEditingSession(session);
        const start = session.start_date ? (typeof session.start_date === 'string' ? session.start_date.slice(0, 10) : session.start_date) : '';
        const end = session.end_date ? (typeof session.end_date === 'string' ? session.end_date.slice(0, 10) : session.end_date) : '';
        setData({
            name: session.name ?? '',
            start_date: start,
            end_date: end,
            is_active: session.is_active ?? false,
            is_current: session.is_current ?? false,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSession) {
            put(route('academic.sessions.update', editingSession.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowModal(false);
                    setEditingSession(null);
                    setData(initialForm);
                    reset();
                },
            });
        } else {
            post(route('academic.sessions.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowModal(false);
                    setData(initialForm);
                    reset();
                },
            });
        }
    };

    const handleDelete = (session) => {
        if (!window.confirm(`Delete session "${session.name}"?`)) return;
        router.delete(route('academic.sessions.destroy', session.id));
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const sessionsList = sessions ?? [];
    const currentSession = sessionsList.find((s) => s.is_current) ?? null;
    const bySession = selectedSessionId
        ? sessionsList.filter((s) => String(s.id) === selectedSessionId)
        : sessionsList;
    const filteredList = activeOnly ? bySession.filter((s) => s.is_active || s.is_current) : bySession;

    const tbodyContent = filteredList.length === 0 ? (
        <tr>
            <td colSpan={6} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <FontAwesomeIcon icon={faCalendarAlt} className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">
                        {sessionsList.length === 0 ? 'No academic sessions yet.' : 'No sessions match the active filter.'}
                    </p>
                    <p className="text-xs mt-1">Click &quot;Add New Session&quot; to create one.</p>
                </div>
            </td>
        </tr>
    ) : filteredList.map((session, idx) => (
        <tr key={session.id} className="hover:bg-gray-50/80 transition-colors">
            <td className="px-6 py-4 text-sm text-gray-600">{idx + 1}</td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center gap-2 font-semibold text-gray-900">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sky-500 w-4 h-4" />
                    {session.name}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(session.start_date)}</td>
            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(session.end_date)}</td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    session.is_current ? 'bg-green-100 text-green-800' : session.is_active ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-600'
                }`}>
                    {session.is_current ? 'Current' : session.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => openEditModal(session)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(session)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    ));

    return (
        <AuthenticatedLayout>
               <Head title="Sessions" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${
                            banner.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                        }`} role="alert">
                            {banner.type === 'success' ? (
                                <svg className="w-5 h-5 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Sessions' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Academic Sessions</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage academic sessions and years</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.academic-session')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    {/* Academic Session filter card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Session</h2>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="min-w-[200px]">
                                <label htmlFor="session-filter" className="block text-xs font-medium text-gray-500 mb-1">Session</label>
                                <select
                                    id="session-filter"
                                    value={selectedSessionId}
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                >
                                    <option value="">All Sessions</option>
                                    {sessionsList.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                            {s.is_current ? ' (Current)' : s.is_active ? ' (Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none mt-5">
                                <input
                                    type="checkbox"
                                    checked={activeOnly}
                                    onChange={(e) => setActiveOnly(e.target.checked)}
                                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active Sessions Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Sessions table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Sessions</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {filteredList.length} session{filteredList.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add New Session
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Session Name</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {tbodyContent}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditingSession(null); }} aria-hidden="true" />
                            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {editingSession ? 'Edit Session' : 'Add Academic Session'}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingSession(null); }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                            aria-label="Close"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6">
                                    <div className="space-y-5">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Session Name *</label>
                                            <input
                                                id="name"
                                                type="text"
                                                name="name"
                                                required
                                                className={`w-full rounded-lg border px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="e.g., 2024-2025"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                            />
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                                                <input
                                                    id="start_date"
                                                    type="date"
                                                    name="start_date"
                                                    required
                                                    className={`w-full rounded-lg border px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${errors.start_date ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={data.start_date}
                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                />
                                                {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
                                                <input
                                                    id="end_date"
                                                    type="date"
                                                    name="end_date"
                                                    required
                                                    className={`w-full rounded-lg border px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${errors.end_date ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={data.end_date}
                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                />
                                                {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 pt-1">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="is_active"
                                                    checked={data.is_active}
                                                    onChange={(e) => setData('is_active', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Active</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    id="is_current"
                                                    checked={data.is_current}
                                                    onChange={(e) => setData('is_current', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Set as current session</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingSession(null); }}
                                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                                        >
                                            {processing ? 'Saving...' : (editingSession ? 'Update' : 'Save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
