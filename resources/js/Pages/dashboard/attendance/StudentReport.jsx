import React, { useMemo, useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faFilePdf } from '@fortawesome/free-solid-svg-icons';

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}

function sid(value) {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
}

export default function StudentReport({
    enrollment,
    monthly,
    monthlyDays = [],
    yearly,
    enrollments = [],
    academicSessions = [],
    filterTree = [],
    filters = {},
}) {
    const allEnrollments = asArray(enrollments);
    const tree = asArray(filterTree);
    const sessions = asArray(academicSessions);

    const [academicSessionId, setAcademicSessionId] = useState(sid(filters.academic_session_id));
    const [classId, setClassId] = useState(sid(filters.class_id));
    const [sectionId, setSectionId] = useState(sid(filters.section_id));
    const [studentEnrollmentId, setStudentEnrollmentId] = useState(sid(filters.student_enrollment_id));
    const [year, setYear] = useState(filters.year ?? new Date().getFullYear());
    const [month, setMonth] = useState(sid(filters.month) || 'all');

    useEffect(() => {
        setAcademicSessionId(sid(filters.academic_session_id));
        setClassId(sid(filters.class_id));
        setSectionId(sid(filters.section_id));
        setStudentEnrollmentId(sid(filters.student_enrollment_id));
        setYear(filters.year ?? new Date().getFullYear());
        setMonth(sid(filters.month) || 'all');
    }, [
        filters.academic_session_id,
        filters.class_id,
        filters.section_id,
        filters.student_enrollment_id,
        filters.year,
        filters.month,
    ]);

    // Hydrate cascade from selected student when session missing in URL.
    useEffect(() => {
        if (!filters.student_enrollment_id || filters.academic_session_id) return;
        const en = allEnrollments.find((row) => sid(row.id) === sid(filters.student_enrollment_id));
        if (!en) return;
        setAcademicSessionId(sid(en.academic_session_id));
        setClassId(sid(en.class_id));
        setSectionId(sid(en.section_id));
    }, [allEnrollments, filters.student_enrollment_id, filters.academic_session_id]);

    const selectedSessionNode = useMemo(
        () => tree.find((s) => sid(s.id) === academicSessionId) || null,
        [tree, academicSessionId]
    );

    const availableClasses = useMemo(
        () => asArray(selectedSessionNode?.classes),
        [selectedSessionNode]
    );

    const selectedClassNode = useMemo(
        () => availableClasses.find((c) => sid(c.id) === classId) || null,
        [availableClasses, classId]
    );

    const availableSections = useMemo(
        () => asArray(selectedClassNode?.sections),
        [selectedClassNode]
    );

    const filteredEnrollments = useMemo(() => {
        return allEnrollments.filter((en) => {
            if (academicSessionId && sid(en.academic_session_id) !== academicSessionId) return false;
            if (classId && sid(en.class_id) !== classId) return false;
            if (sectionId && sid(en.section_id) !== sectionId) return false;
            return true;
        });
    }, [allEnrollments, academicSessionId, classId, sectionId]);

    useEffect(() => {
        if (!studentEnrollmentId) return;
        const stillVisible = filteredEnrollments.some((en) => sid(en.id) === studentEnrollmentId);
        if (!stillVisible) setStudentEnrollmentId('');
    }, [filteredEnrollments, studentEnrollmentId]);

    // Clear invalid class/section when session/class changes.
    useEffect(() => {
        if (classId && !availableClasses.some((c) => sid(c.id) === classId)) {
            setClassId('');
            setSectionId('');
            setStudentEnrollmentId('');
        }
    }, [availableClasses, classId]);

    useEffect(() => {
        if (sectionId && !availableSections.some((s) => sid(s.id) === sectionId)) {
            setSectionId('');
            setStudentEnrollmentId('');
        }
    }, [availableSections, sectionId]);

    const sessionOptions = useMemo(() => {
        const source = tree.length ? tree : sessions;
        return source.map((s) => ({
            value: String(s.id),
            label: s.name,
            searchText: s.name,
            selectedLabel: s.name,
        }));
    }, [tree, sessions]);

    const classOptions = useMemo(
        () =>
            availableClasses.map((c) => ({
                value: String(c.id),
                label: c.name,
                searchText: c.name,
                selectedLabel: c.name,
            })),
        [availableClasses]
    );

    const sectionOptions = useMemo(
        () =>
            availableSections.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
                selectedLabel: s.name,
            })),
        [availableSections]
    );

    const studentOptions = useMemo(
        () =>
            filteredEnrollments.map((en) => {
                const meta = [en.class_name, en.section_name, en.group_name].filter(Boolean).join(' · ');
                const label = [en.student_name, en.roll_number ? `Roll: ${en.roll_number}` : null, meta]
                    .filter(Boolean)
                    .join(' — ');
                return {
                    value: String(en.id),
                    label,
                    searchText: label,
                    selectedLabel: en.student_name,
                };
            }),
        [filteredEnrollments]
    );

    const monthOptions = useMemo(
        () => [
            { value: 'all', label: 'All months (yearly only)', selectedLabel: 'All months (yearly only)' },
            ...Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const label = new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' });
                return { value: String(m), label, searchText: label, selectedLabel: label };
            }),
        ],
        []
    );

    const onSessionChange = (value) => {
        setAcademicSessionId(sid(value));
        setClassId('');
        setSectionId('');
        setStudentEnrollmentId('');
    };

    const onClassChange = (value) => {
        setClassId(sid(value));
        setSectionId('');
        setStudentEnrollmentId('');
    };

    const onSectionChange = (value) => {
        setSectionId(sid(value));
        setStudentEnrollmentId('');
    };

    const handleFilter = (e) => {
        e?.preventDefault();
        if (!studentEnrollmentId) return;

        const params = { year, student_enrollment_id: studentEnrollmentId };
        if (academicSessionId) params.academic_session_id = academicSessionId;
        if (classId) params.class_id = classId;
        if (sectionId) params.section_id = sectionId;
        if (month && month !== 'all') params.month = month;

        router.get(route('attendance.reports.student'), params, { preserveState: true });
    };

    const pdfUrl = useMemo(() => {
        if (!studentEnrollmentId || !month || month === 'all') return null;
        const params = new URLSearchParams({
            student_enrollment_id: String(studentEnrollmentId),
            year: String(year),
            month: String(month),
        });
        if (academicSessionId) params.set('academic_session_id', String(academicSessionId));
        return route('attendance.reports.student.pdf') + '?' + params.toString();
    }, [studentEnrollmentId, year, month, academicSessionId]);

    const statusClass = (status) => {
        switch (String(status || '').toLowerCase()) {
            case 'present':
                return 'bg-green-100 text-green-800';
            case 'absent':
                return 'bg-red-100 text-red-800';
            case 'late':
                return 'bg-amber-100 text-amber-800';
            case 'leave':
                return 'bg-gray-100 text-gray-700';
            default:
                return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student-wise Attendance Report" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <Link
                                href={route('attendance.reports.index')}
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                ← Reports
                            </Link>
                            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                                <FontAwesomeIcon icon={faChartBar} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student-wise Attendance Report</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Select session, then class, then section — students update automatically.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-6 overflow-visible relative z-10">
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                            <p className="text-xs text-gray-500">
                                {academicSessionId
                                    ? `${classOptions.length} class(es), ${sectionOptions.length} section(s), ${filteredEnrollments.length} student(s)`
                                    : 'Choose a session to load classes'}
                            </p>
                        </div>
                        <form
                            onSubmit={handleFilter}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end"
                        >
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Session *</label>
                                <SearchableSelect
                                    options={sessionOptions}
                                    value={academicSessionId}
                                    onChange={onSessionChange}
                                    placeholder="Select session..."
                                    emptyText="No session found"
                                    inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Class *</label>
                                <SearchableSelect
                                    options={classOptions}
                                    value={classId}
                                    onChange={onClassChange}
                                    placeholder={academicSessionId ? 'Select class...' : 'Select session first'}
                                    emptyText={
                                        academicSessionId
                                            ? 'No class linked to this session'
                                            : 'Select session first'
                                    }
                                    inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Section *</label>
                                <SearchableSelect
                                    options={sectionOptions}
                                    value={sectionId}
                                    onChange={onSectionChange}
                                    placeholder={classId ? 'Select section...' : 'Select class first'}
                                    emptyText={classId ? 'No section for this class' : 'Select class first'}
                                    inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Student *</label>
                                <SearchableSelect
                                    options={studentOptions}
                                    value={studentEnrollmentId}
                                    onChange={(value) => setStudentEnrollmentId(sid(value))}
                                    placeholder={
                                        sectionId || classId || academicSessionId
                                            ? filteredEnrollments.length
                                                ? 'Select student...'
                                                : 'No students for selected filters'
                                            : 'Select session first'
                                    }
                                    emptyText="No students found"
                                    inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    min="2020"
                                    max="2100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Month (required for date-wise PDF)
                                </label>
                                <SearchableSelect
                                    options={monthOptions}
                                    value={month || 'all'}
                                    onChange={(value) => setMonth(sid(value) || 'all')}
                                    placeholder="All months"
                                    inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={!studentEnrollmentId}
                                    className="inline-flex w-full items-center justify-center bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
                                >
                                    Apply
                                </button>
                            </div>
                        </form>
                    </div>

                    {enrollment && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Student</h2>
                                <p className="text-sm text-gray-600">
                                    {enrollment.student?.full_name ?? enrollment.student?.user?.name ?? '—'} · Roll:{' '}
                                    {enrollment.roll_number} · {groupLabel(enrollment.class_section_group)}
                                </p>
                            </div>
                            {yearly && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        Yearly Summary ({yearly.year})
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                        <div>
                                            <div className="text-gray-500 text-xs">Total</div>
                                            <div className="text-xl font-bold">{yearly.total}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Present</div>
                                            <div className="text-xl font-bold text-green-600">{yearly.present}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Absent</div>
                                            <div className="text-xl font-bold text-red-600">{yearly.absent}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Late</div>
                                            <div className="text-xl font-bold text-amber-600">{yearly.late}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Leave</div>
                                            <div className="text-xl font-bold text-gray-600">{yearly.leave}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Percentage</div>
                                            <div className="text-xl font-bold text-sky-600">{yearly.percentage}%</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {monthly && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Monthly Summary ({monthly.month_label || `${monthly.year}-${String(monthly.month).padStart(2, '0')}`})
                                        </h2>
                                        {pdfUrl ? (
                                            <a
                                                href={pdfUrl}
                                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-4 rounded-lg"
                                            >
                                                <FontAwesomeIcon icon={faFilePdf} className="text-sm" />
                                                Download Monthly PDF
                                            </a>
                                        ) : (
                                            <p className="text-xs text-gray-500">Select a month to download PDF.</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                                        <div>
                                            <div className="text-gray-500 text-xs">Total</div>
                                            <div className="text-xl font-bold">{monthly.total}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Present</div>
                                            <div className="text-xl font-bold text-green-600">{monthly.present}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Absent</div>
                                            <div className="text-xl font-bold text-red-600">{monthly.absent}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Late</div>
                                            <div className="text-xl font-bold text-amber-600">{monthly.late}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Leave</div>
                                            <div className="text-xl font-bold text-gray-600">{monthly.leave}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500 text-xs">Percentage</div>
                                            <div className="text-xl font-bold text-sky-600">{monthly.percentage}%</div>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Date-wise Attendance</h3>
                                    {asArray(monthlyDays).length === 0 ? (
                                        <p className="text-sm text-gray-500">No attendance records for this month.</p>
                                    ) : (
                                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50 text-left text-gray-500">
                                                    <tr>
                                                        <th className="px-3 py-2 font-medium">#</th>
                                                        <th className="px-3 py-2 font-medium">Date</th>
                                                        <th className="px-3 py-2 font-medium">Day</th>
                                                        <th className="px-3 py-2 font-medium">Status</th>
                                                        <th className="px-3 py-2 font-medium">Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {asArray(monthlyDays).map((day, idx) => (
                                                        <tr key={`${day.date}-${idx}`} className="border-t border-gray-100">
                                                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                                            <td className="px-3 py-2 text-gray-900">{day.date_label}</td>
                                                            <td className="px-3 py-2 text-gray-600">{day.day_name}</td>
                                                            <td className="px-3 py-2">
                                                                <span
                                                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(day.status)}`}
                                                                >
                                                                    {day.status_label || day.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-500">{day.remarks || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
