import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faPenToSquare, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function TimetableAdjustmentsIndex(props) {
    const { props: pageProps } = usePage();
    const adjustments = props.adjustments ?? pageProps.adjustments ?? [];
    const teachers = props.teachers ?? pageProps.teachers ?? [];
    const filterDate = props.filterDate ?? pageProps.filterDate ?? '';
    const filterTeacherId = props.filterTeacherId ?? pageProps.filterTeacherId ?? '';
    const filterAction = props.filterAction ?? pageProps.filterAction ?? '';

    const applyFilter = (date, teacherId, action) => {
        const params = {};
        if (date) params.adjustment_date = date;
        if (teacherId) params.original_teacher_id = teacherId;
        if (action) params.action = action;
        router.get(route('academic.timetable-adjustments.index'), Object.keys(params).length ? params : {}, { preserveState: true });
    };

    const entryLabel = (adj) => {
        const te = adj.timetable_enter ?? adj.timetableEnter;
        const tt = te?.timetable;
        const csg = tt?.class_section_group ?? tt?.classSectionGroup;
        const cs = csg?.class_section ?? csg?.classSection;
        const sub = te?.class_section_group_subject ?? te?.classSectionGroupSubject;
        const slot = te?.time_slot ?? te?.timeSlot;
        const parts = [];
        if (cs?.class?.name) parts.push(cs.class.name);
        if (cs?.section?.name) parts.push(cs.section.name);
        const classSec = parts.join(' - ');
        const subjectName = sub?.subject?.name ?? '—';
        const slotName = slot?.name ?? te?.time_slot_id ?? '—';
        return { classSec, subjectName, slotName };
    };

    return (
        <AuthenticatedLayout>
            <Head title="Time Table Adjustments" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Timetable Adjustments' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faPenToSquare} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Timetable Adjustments</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Substitutions and cancellations (e.g. when teacher is on leave)</p>
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
                            <label className="text-sm font-medium text-gray-700">Date</label>
                            <input
                                type="date"
                                value={filterDate || ''}
                                onChange={(e) => applyFilter(e.target.value, filterTeacherId, filterAction)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                            <label className="text-sm font-medium text-gray-700">Teacher (original)</label>
                            <select value={filterTeacherId || ''} onChange={(e) => applyFilter(filterDate, e.target.value, filterAction)} className="min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                <option value="">All</option>
                                {teachers.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                            </select>
                            <label className="text-sm font-medium text-gray-700">Action</label>
                            <select value={filterAction || ''} onChange={(e) => applyFilter(filterDate, filterTeacherId, e.target.value)} className="min-w-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                <option value="">All</option>
                                <option value="substitute">Substitute</option>
                                <option value="cancel">Cancel</option>
                                <option value="merge">Merge</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Adjustments</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {adjustments.length} (created automatically when teacher leave is approved)</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class / Slot</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Original Teacher</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substitute</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {adjustments.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No adjustments found.</td>
                                        </tr>
                                    ) : (
                                        adjustments.map((adj) => {
                                            const { classSec, subjectName, slotName } = entryLabel(adj);
                                            return (
                                                <tr key={adj.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {adj.adjustment_date ? new Date(adj.adjustment_date).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">{classSec || '—'} / {slotName}</td>
                                                    <td className="px-6 py-4 text-sm">{subjectName}</td>
                                                    <td className="px-6 py-4 text-sm">{adj.original_teacher?.user?.name ?? adj.originalTeacher?.user?.name ?? '—'}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {(adj.action === 'substitute' || adj.action === 'cancel') && (
                                                            <select
                                                                value={adj.substitute_teacher_id ?? adj.substitute_teacher?.id ?? ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    router.put(route('academic.timetable-adjustments.update', adj.id), {
                                                                        substitute_teacher_id: val ? Number(val) : null,
                                                                        action: val ? 'substitute' : 'cancel',
                                                                    }, { preserveScroll: true });
                                                                }}
                                                                className="min-w-[140px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                            >
                                                                <option value="">— Select substitute —</option>
                                                                {(teachers.filter((t) => Number(t.id) !== Number(adj.original_teacher_id ?? adj.original_teacher?.id))).map((t) => (
                                                                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {adj.action === 'merge' && (
                                                            <select
                                                                value={adj.merged_into_timetable_entry_id ?? adj.merged_into_timetable_entry?.id ?? ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    router.put(route('academic.timetable-adjustments.update', adj.id), {
                                                                        merged_into_timetable_entry_id: val ? Number(val) : null,
                                                                        action: 'merge',
                                                                    }, { preserveScroll: true });
                                                                }}
                                                                className="min-w-[160px] border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                            >
                                                                <option value="">— Merge into slot —</option>
                                                                {(adj.merge_target_options || []).map((opt) => (
                                                                    <option key={opt.id} value={String(opt.id)}>{opt.label}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={adj.action || 'cancel'}
                                                            onChange={(e) => {
                                                                const action = e.target.value;
                                                                router.put(route('academic.timetable-adjustments.update', adj.id), { action }, { preserveScroll: true });
                                                            }}
                                                            className={`min-w-[100px] border rounded-lg px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                                                                adj.action === 'substitute' ? 'border-green-300 bg-green-50 text-green-800' :
                                                                adj.action === 'cancel' ? 'border-red-300 bg-red-50 text-red-800' : 'border-amber-300 bg-amber-50 text-amber-800'
                                                            }`}
                                                        >
                                                            <option value="substitute">Substitute</option>
                                                            <option value="cancel">Cancel</option>
                                                            <option value="merge">Merge</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{adj.note || '—'}</td>
                                                </tr>
                                            );
                                        })
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
