import React, { useMemo, useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

function formatDateForInput(d) {
    if (!d) return '';
    const x = typeof d === 'string' ? d : (d?.date ?? d);
    if (typeof x === 'string' && x.match(/^\d{4}-\d{2}-\d{2}/)) return x.slice(0, 10);
    if (d && typeof d.getMonth === 'function') return d.toISOString().slice(0, 10);
    return '';
}

const TYPE_OPTIONS = [
    { value: 'student', label: 'Student', searchText: 'student' },
    { value: 'teacher', label: 'Teacher', searchText: 'teacher' },
    { value: 'employee', label: 'Employee', searchText: 'employee' },
];

export default function SessionEdit({ session, academicSessions = [], classSectionGroups = [] }) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { props } = usePage();
    const { data, setData, put, processing, errors } = useForm({
        attendance_date: formatDateForInput(session.attendance_date) || new Date().toISOString().split('T')[0],
        academic_session_id: String(session.academic_session_id ?? ''),
        type: session.type || 'student',
        class_section_group_id: session.class_section_group_id ? String(session.class_section_group_id) : '',
    });

    useEffect(() => {
        const flash = props?.flash || {};
        if (flash.success) setBanner({ type: 'success', message: flash.success });
        else if (flash.error) setBanner({ type: 'error', message: flash.error });
    }, [props?.flash]);

    const sessionOptions = useMemo(
        () => academicSessions.map((s) => ({
            value: String(s.id),
            label: s.name,
            searchText: s.name,
        })),
        [academicSessions]
    );

    const groupOptions = useMemo(
        () => classSectionGroups.map((csg) => {
            const label = groupLabel(csg);
            return { value: String(csg.id), label, searchText: label };
        }),
        [classSectionGroups]
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('attendance.sessions.update', session.id), { preserveScroll: true });
    };

    const inputClass = (hasError) =>
        `w-full rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

    return (
        <AuthenticatedLayout>
            <Head title="Edit Attendance Session" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('attendance.sessions.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to Sessions</Link>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Attendance Session</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Update session details. Session cannot be edited when locked.</p>
                            </div>
                        </div>
                    </div>

                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg border ${banner.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Date *</label>
                                <input
                                    type="date"
                                    className={inputClass(!!errors.attendance_date)}
                                    value={data.attendance_date}
                                    onChange={(e) => setData('attendance_date', e.target.value)}
                                    required
                                />
                                {errors.attendance_date && <p className="mt-1 text-sm text-red-600">{errors.attendance_date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session *</label>
                                <SearchableSelect
                                    options={sessionOptions}
                                    value={data.academic_session_id}
                                    onChange={(value) => setData('academic_session_id', value)}
                                    placeholder="Search academic session..."
                                    inputClassName={inputClass(!!errors.academic_session_id)}
                                    emptyText="No sessions found"
                                />
                                {errors.academic_session_id && <p className="mt-1 text-sm text-red-600">{errors.academic_session_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <SearchableSelect
                                    options={TYPE_OPTIONS}
                                    value={data.type}
                                    onChange={(value) => {
                                        setData('type', value);
                                        if (value !== 'student') setData('class_section_group_id', '');
                                    }}
                                    placeholder="Search type..."
                                    inputClassName={inputClass(!!errors.type)}
                                    emptyText="No types found"
                                />
                                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                            </div>
                            {data.type === 'student' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group *</label>
                                    <SearchableSelect
                                        options={groupOptions}
                                        value={data.class_section_group_id}
                                        onChange={(value) => setData('class_section_group_id', value)}
                                        placeholder="Search class section group..."
                                        inputClassName={inputClass(!!errors.class_section_group_id)}
                                        emptyText="No groups found"
                                    />
                                    {errors.class_section_group_id && <p className="mt-1 text-sm text-red-600">{errors.class_section_group_id}</p>}
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <Link href={route('attendance.sessions.index')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm">
                                    Cancel
                                </Link>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm disabled:opacity-50">
                                    {processing ? 'Saving...' : 'Update Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
