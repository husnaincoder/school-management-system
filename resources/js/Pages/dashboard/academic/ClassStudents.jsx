import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faFilter, faArrowLeft, faSearch, faPrint, faFileCsv, faFilePdf } from '@fortawesome/free-solid-svg-icons';

const filterSelectClass =
    'min-w-[180px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

function formatDate(value) {
    if (!value || value === '—') return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClassStudents({
    academicSessions = [],
    classes = [],
    sections = [],
    classSections = [],
    students = null,
    filters = {},
    searched = false,
}) {
    const sessions = Array.isArray(academicSessions) ? academicSessions : [];
    const classList = Array.isArray(classes) ? classes : [];
    const sectionList = Array.isArray(sections) ? sections : [];
    const classSectionRows = Array.isArray(classSections) ? classSections : [];
    const list = students?.data ?? [];
    const pagination = students?.links ? { ...students, data: undefined } : null;
    const total = students?.total ?? list.length;
    const [selectedIds, setSelectedIds] = useState([]);

    const filterForm = useForm({
        academic_session_id: filters.academic_session_id ?? '',
        class_id: filters.class_id ?? '',
        section_id: filters.section_id ?? '',
    });

    const availableClasses = useMemo(() => {
        const sessionId = filterForm.data.academic_session_id;
        if (!sessionId) {
            // Prefer classes that appear in any class-section; fall back to full list
            const linked = new Map();
            classSectionRows.forEach((cs) => {
                const id = String(cs.class_id);
                if (!linked.has(id)) {
                    const fromList = classList.find((c) => String(c.id) === id);
                    linked.set(id, {
                        id: cs.class_id,
                        name: cs.class_name || fromList?.name || `Class #${id}`,
                    });
                }
            });
            if (linked.size > 0) return Array.from(linked.values());
            return classList;
        }

        const linked = new Map();
        classSectionRows
            .filter((cs) => String(cs.academic_session_id) === String(sessionId))
            .forEach((cs) => {
                const id = String(cs.class_id);
                if (!linked.has(id)) {
                    const fromList = classList.find((c) => String(c.id) === id);
                    linked.set(id, {
                        id: cs.class_id,
                        name: cs.class_name || fromList?.name || `Class #${id}`,
                    });
                }
            });
        return Array.from(linked.values());
    }, [filterForm.data.academic_session_id, classSectionRows, classList]);

    const availableSections = useMemo(() => {
        let rows = classSectionRows;
        if (filterForm.data.academic_session_id) {
            rows = rows.filter(
                (cs) => String(cs.academic_session_id) === String(filterForm.data.academic_session_id)
            );
        }
        if (filterForm.data.class_id) {
            rows = rows.filter((cs) => String(cs.class_id) === String(filterForm.data.class_id));
        }

        const linked = new Map();
        rows.forEach((cs) => {
            if (cs.section_id == null) return;
            const id = String(cs.section_id);
            if (!linked.has(id)) {
                const fromList = sectionList.find((s) => String(s.id) === id);
                linked.set(id, {
                    id: cs.section_id,
                    name: cs.section_name || fromList?.name || `Section #${id}`,
                });
            }
        });
        return Array.from(linked.values());
    }, [filterForm.data.academic_session_id, filterForm.data.class_id, classSectionRows, sectionList]);

    const sessionOptions = useMemo(
        () => [
            { value: '', label: 'All sessions' },
            ...sessions.map((s) => ({
                value: String(s.id),
                label: `${s.name}${s.is_active ? '' : ' (inactive)'}`,
                searchText: s.name,
            })),
        ],
        [sessions]
    );

    const classOptions = useMemo(
        () => [
            { value: '', label: 'All classes' },
            ...availableClasses.map((c) => ({
                value: String(c.id),
                label: c.name,
                searchText: c.name,
            })),
        ],
        [availableClasses]
    );

    const sectionOptions = useMemo(
        () => [
            { value: '', label: 'All sections' },
            ...availableSections.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
            })),
        ],
        [availableSections]
    );

    const submitSearch = (e) => {
        e.preventDefault();
        setSelectedIds([]);
        const params = { searched: 1 };
        if (filterForm.data.academic_session_id) params.academic_session_id = filterForm.data.academic_session_id;
        if (filterForm.data.class_id) params.class_id = filterForm.data.class_id;
        if (filterForm.data.section_id) params.section_id = filterForm.data.section_id;
        router.get(route('academic.class-students'), params, { preserveState: true });
    };

    const resetFilters = () => {
        filterForm.setData({ academic_session_id: '', class_id: '', section_id: '' });
        setSelectedIds([]);
        router.get(route('academic.class-students'));
    };

    const onSessionChange = (value) => {
        filterForm.setData({
            academic_session_id: value,
            class_id: '',
            section_id: '',
        });
    };

    const onClassChange = (value) => {
        filterForm.setData({
            ...filterForm.data,
            class_id: value,
            section_id: '',
        });
    };

    const listIds = useMemo(() => list.map((x) => x.id), [list]);
    const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
    const allOnPageSelected = listIds.length > 0 && listIds.every((id) => selectedSet.has(String(id)));

    const toggleSelectAllOnPage = () => {
        if (allOnPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !listIds.includes(id)));
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...listIds])));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const exportUrl = (format) => {
        const params = new URLSearchParams();
        if (filterForm.data.academic_session_id) params.set('academic_session_id', filterForm.data.academic_session_id);
        if (filterForm.data.class_id) params.set('class_id', filterForm.data.class_id);
        if (filterForm.data.section_id) params.set('section_id', filterForm.data.section_id);
        selectedIds.forEach((id) => params.append('ids[]', String(id)));
        return route('academic.class-students.export.' + format) + (params.toString() ? `?${params.toString()}` : '');
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Students" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Class Students' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUsers} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class & Students</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Filter by session, class and section to view student details
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.students-enrollments')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Search Filters
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Session, Class and Section are optional. Select any combination and click Search.
                        </p>
                        {searched && (
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <p className="text-sm text-gray-500">
                                    {selectedIds.length > 0 ? (
                                        <>
                                            Selected: <span className="font-semibold text-gray-900">{selectedIds.length}</span> · Export will download selected only.
                                            <button type="button" onClick={() => setSelectedIds([])} className="ml-2 text-amber-600 hover:text-amber-700 font-medium">
                                                Clear
                                            </button>
                                        </>
                                    ) : (
                                        'Tip: Select students from the list, then export.'
                                    )}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <a
                                        href={exportUrl('csv')}
                                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-medium text-sm"
                                    >
                                        <FontAwesomeIcon icon={faFileCsv} className="text-sm" />
                                        Export CSV
                                    </a>
                                    <a
                                        href={exportUrl('pdf')}
                                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg font-medium text-sm"
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} className="text-sm" />
                                        Export PDF
                                    </a>
                                </div>
                            </div>
                        )}
                        <form onSubmit={submitSearch} className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[180px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                                <SearchableSelect
                                    options={sessionOptions}
                                    value={filterForm.data.academic_session_id}
                                    onChange={onSessionChange}
                                    placeholder="Search session..."
                                    inputClassName={filterSelectClass}
                                    emptyText="No session found"
                                />
                            </div>
                            <div className="min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <SearchableSelect
                                    options={classOptions}
                                    value={filterForm.data.class_id}
                                    onChange={onClassChange}
                                    placeholder="Search class..."
                                    inputClassName={filterSelectClass}
                                    emptyText="No class found"
                                />
                            </div>
                            <div className="min-w-[140px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                <SearchableSelect
                                    options={sectionOptions}
                                    value={filterForm.data.section_id}
                                    onChange={(id) => filterForm.setData('section_id', id)}
                                    placeholder="Search section..."
                                    inputClassName={filterSelectClass}
                                    emptyText="No section found"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                            >
                                <FontAwesomeIcon icon={faSearch} className="text-sm" />
                                Search
                            </button>
                            {searched && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm"
                                >
                                    Reset
                                </button>
                            )}
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Student List</h2>
                            {searched ? (
                                <p className="text-sm text-gray-500 mt-0.5">Total: {total} student{total !== 1 ? 's' : ''}</p>
                            ) : (
                                <p className="text-sm text-gray-500 mt-0.5">Use filters above and click Search to load students.</p>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={allOnPageSelected}
                                                    onChange={toggleSelectAllOnPage}
                                                />
                                                <span>Select</span>
                                            </label>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission / Roll No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Birth</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Father Mobile</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {!searched ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                                                Select Session, Class and/or Section, then click Search.
                                            </td>
                                        </tr>
                                    ) : list.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                                                No students found for the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50/80">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSet.has(String(row.id))}
                                                        onChange={() => toggleSelectOne(row.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.admission_roll}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {row.student_id ? (
                                                        <Link href={route('academic.students.show', row.student_id)} className="text-amber-600 hover:text-amber-700 hover:underline font-medium">
                                                            {row.student_name}
                                                        </Link>
                                                    ) : (
                                                        row.student_name
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <div>{row.class_label}</div>
                                                    {row.session_name && row.session_name !== '—' && (
                                                        <div className="text-xs text-gray-500">{row.session_name}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{row.father_name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{formatDate(row.date_of_birth)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{row.gender}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{row.father_mobile}</td>
                                                <td className="px-4 py-3">
                                                    <a
                                                        href={route('academic.class-students.print', row.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                        title="Print PDF"
                                                    >
                                                        <FontAwesomeIcon icon={faPrint} className="text-sm" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {pagination?.links && pagination.links.length > 0 && (
                        <div className="mt-4 flex justify-end gap-2 flex-wrap">
                            {pagination.links.map((link, i) => (
                                link.url ? (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        preserveState
                                    >
                                        {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                    </Link>
                                ) : (
                                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
                                        {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                    </span>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
