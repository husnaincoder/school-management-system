import React from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faCalendarCheck, faEye, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function TimetablesIndex(props) {
    const { props: pageProps } = usePage();
    const timetables = props.timetables ?? pageProps.timetables ?? [];
    const sessions = props.academicSessions ?? pageProps.academicSessions ?? [];
    const classSectionGroups = props.classSectionGroups ?? pageProps.classSectionGroups ?? [];
    const filterSessionId = props.filterSessionId ?? pageProps.filterSessionId ?? '';
    const filterClassSectionGroupId = props.filterClassSectionGroupId ?? pageProps.filterClassSectionGroupId ?? '';

    const applyFilter = (sessionId, groupId) => {
        const params = {};
        if (sessionId) params.academic_session_id = sessionId;
        if (groupId) params.class_section_group_id = groupId;
        router.get(route('academic.timetables.index'), Object.keys(params).length ? params : {}, { preserveState: true });
    };

    const handleDelete = (t) => {
        if (!window.confirm('Delete this timetable?')) return;
        router.delete(route('academic.timetables.destroy', t.id));
    };

    const label = (t) => {
        const csg = t.class_section_group ?? t.classSectionGroup;
        const cs = csg?.class_section ?? csg?.classSection;
        const cls = cs?.class?.name ?? '';
        const sec = cs?.section?.name ?? '';
        const sg = csg?.subject_group ?? csg?.subjectGroup;
        const sgName = sg?.name ?? '';
        return [cls, sec].filter(Boolean).join(' - ') + (sgName ? ` (${sgName})` : '');
    };

    return (
        <AuthenticatedLayout>
               <Head title="Time Table" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Timetables' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Timetables</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage class timetables</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.timetable-management')}
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
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <label className="text-sm font-medium text-gray-700 shrink-0">Session</label>
                            <select
                                value={filterSessionId || ''}
                                onChange={(e) => applyFilter(e.target.value, filterClassSectionGroupId)}
                                className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">All sessions</option>
                                {sessions.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                            </select>
                            <label className="text-sm font-medium text-gray-700 shrink-0">Class Section Group</label>
                            <select
                                value={filterClassSectionGroupId || ''}
                                onChange={(e) => applyFilter(filterSessionId, e.target.value)}
                                className="min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">All</option>
                                {classSectionGroups.map((g) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Timetables</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {timetables.length}</p>
                            </div>
                            <Link
                                href={route('academic.timetables.create')}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Timetable
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Section Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {timetables.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No timetables found. Click &quot;Add Timetable&quot; to create one.</td>
                                        </tr>
                                    ) : (
                                        timetables.map((t) => (
                                            <tr key={t.id}>
                                                <td className="px-6 py-4">{t.academic_session?.name ?? t.academicSession?.name ?? '—'}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{label(t)}</td>
                                                <td className="px-6 py-4">{t.name || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded capitalize ${
                                                        (t.status || (t.is_active ? 'published' : 'draft')) === 'published' ? 'bg-green-100 text-green-800'
                                                        : (t.status === 'archived' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800')
                                                    }`}>
                                                        {t.status || (t.is_active ? 'published' : 'draft')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={route('academic.timetables.show', t.id)} className="text-amber-500 hover:text-amber-600 mr-3"><FontAwesomeIcon icon={faEye} className="text-sm" /></Link>
                                                    <Link href={route('academic.timetables.edit', t.id)} className="text-amber-500 hover:text-amber-600 mr-3"><FontAwesomeIcon icon={faPen} className="text-sm" /></Link>
                                                    <button type="button" onClick={() => handleDelete(t)} className="text-red-500 hover:text-red-600"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
