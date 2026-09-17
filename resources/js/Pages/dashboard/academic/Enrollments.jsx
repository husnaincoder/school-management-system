import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faPlus, faFilter, faEye, faPen, faTrashCan, faArrowLeft, faFileCsv, faFilePdf } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) => `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;
const filterSelectClass = 'min-w-[200px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section;
    const session = cs?.academic_session?.name ?? '';
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? '';
    return [session, cls, sec, grp].filter(Boolean).join(' · ') || csg.id;
}

function studentName(student) {
    if (!student) return '—';
    const name = [student.first_name, student.last_name].filter(Boolean).join(' ');
    return name || student.user?.name || student.user?.email || '—';
}

export default function EnrollmentsIndex({
    enrollments,
    studentsWithoutEnrollment = [],
    classSectionGroups = [],
    filters = {},
}) {
    const [showModal, setShowModal] = useState(false);
    const [editEnrollment, setEditEnrollment] = useState(null);
    const [deleteEnrollment, setDeleteEnrollment] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const list = enrollments?.data ?? enrollments ?? [];
    const pagination = enrollments?.links ? { ...enrollments, data: undefined } : null;
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const unenrolledStudents = Array.isArray(studentsWithoutEnrollment) ? studentsWithoutEnrollment : [];

    const filterForm = useForm({
        search: filters.search ?? '',
        class_section_group_id: filters.class_section_group_id ?? '',
        status: filters.status ?? '',
    });

    const listIds = useMemo(() => list.map((x) => x.id), [list]);
    const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds]);
    const allOnPageSelected = listIds.length > 0 && listIds.every((id) => selectedSet.has(String(id)));

    const groupOptions = useMemo(
        () => groups.map((g) => {
            const label = groupLabel(g);
            return { value: String(g.id), label, searchText: label };
        }),
        [groups]
    );

    const filterGroupOptions = useMemo(
        () => [{ value: '', label: 'All groups' }, ...groupOptions],
        [groupOptions]
    );

    const statusOptions = useMemo(
        () => [
            { value: '', label: 'All status' },
            { value: 'active', label: 'Active' },
            { value: 'promoted', label: 'Promoted' },
            { value: 'left', label: 'Left' },
        ],
        []
    );

    const studentOptions = useMemo(
        () => unenrolledStudents.map((s) => {
            const name = studentName(s);
            const extra = s.admission_number || s.user?.email || '';
            const label = extra ? `${name} (${extra})` : name;
            return { value: String(s.id), label, searchText: `${name} ${extra}` };
        }),
        [unenrolledStudents]
    );

    const enrollmentStatusOptions = useMemo(
        () => [
            { value: 'active', label: 'Active' },
            { value: 'promoted', label: 'Promoted' },
            { value: 'left', label: 'Left' },
        ],
        []
    );

    const exportUrl = (format) => {
        const params = new URLSearchParams();
        if (filterForm.data.search) params.set('search', filterForm.data.search);
        if (filterForm.data.class_section_group_id) params.set('class_section_group_id', filterForm.data.class_section_group_id);
        if (filterForm.data.status) params.set('status', filterForm.data.status);
        selectedIds.forEach((id) => params.append('ids[]', String(id)));
        return route('academic.enrollments.export.' + format) + (params.toString() ? `?${params.toString()}` : '');
    };

    const submitFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filterForm.data.search) params.search = filterForm.data.search;
        if (filterForm.data.class_section_group_id) params.class_section_group_id = filterForm.data.class_section_group_id;
        if (filterForm.data.status) params.status = filterForm.data.status;
        router.get(route('academic.enrollments'), params, { preserveState: true });
    };

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

    const addForm = useForm({
        student_id: '',
        class_section_group_id: '',
        roll_number: '',
        admission_date: '',
        status: 'active',
    });

    const editForm = useForm({
        class_section_group_id: '',
        roll_number: '',
        admission_date: '',
        status: 'active',
    });

    const openEdit = (enrollment) => {
        setEditEnrollment(enrollment);
        editForm.setData({
            class_section_group_id: enrollment.class_section_group_id ?? '',
            roll_number: enrollment.roll_number ?? '',
            admission_date: enrollment.admission_date ? enrollment.admission_date.split('T')[0] : '',
            status: enrollment.status ?? 'active',
        });
    };

    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post(route('academic.enrollments.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowModal(false);
                addForm.reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editEnrollment) return;
        editForm.patch(route('academic.enrollments.update', editEnrollment.id), {
            preserveScroll: true,
            onSuccess: () => setEditEnrollment(null),
        });
    };

    const confirmDelete = () => {
        if (!deleteEnrollment) return;
        router.delete(route('academic.enrollments.destroy', deleteEnrollment.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteEnrollment(null),
        });
    };

    const total = enrollments?.total ?? list.length;

    return (
        <AuthenticatedLayout>
            <Head title="Enrollments" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Enrollments' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClipboardList} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Enrollments</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Enroll students in class section groups</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.students-enrollments')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                                    Filters & Export
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedIds.length > 0 ? (
                                        <>
                                            Selected: <span className="font-semibold text-gray-900">{selectedIds.length}</span> · Export will download selected only.
                                            <button type="button" onClick={() => setSelectedIds([])} className="ml-2 text-amber-600 hover:text-amber-700 font-medium">
                                                Clear
                                            </button>
                                        </>
                                    ) : (
                                        'Apply filters, then export the same results.'
                                    )}
                                </p>
                            </div>
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

                        <form onSubmit={submitFilters} className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <label htmlFor="enrollment-search" className="text-sm font-medium text-gray-700 shrink-0">Search</label>
                                <input
                                    id="enrollment-search"
                                    type="text"
                                    placeholder="Search by student name, admission no..."
                                    className="min-w-[200px] flex-1 max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                />
                            </div>
                            <div className="min-w-[200px]">
                                <SearchableSelect
                                    options={filterGroupOptions}
                                    value={filterForm.data.class_section_group_id}
                                    onChange={(id) => filterForm.setData('class_section_group_id', id)}
                                    placeholder="Search group..."
                                    inputClassName={filterSelectClass}
                                />
                            </div>
                            <div className="min-w-[140px]">
                                <SearchableSelect
                                    options={statusOptions}
                                    value={filterForm.data.status}
                                    onChange={(id) => filterForm.setData('status', id)}
                                    placeholder="Status..."
                                    inputClassName={filterSelectClass}
                                />
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Filter
                            </button>
                        </form>
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Enrollments</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {total} enrollment{total !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={allOnPageSelected}
                                                    onChange={toggleSelectAllOnPage}
                                                />
                                                <span>Select</span>
                                            </label>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class · Section · Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No enrollments found. Click &quot;Add Enrollment&quot; to create one.</td>
                                        </tr>
                                    ) : (
                                        list.map((enrollment) => (
                                            <tr key={enrollment.id}>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSet.has(String(enrollment.id))}
                                                        onChange={() => toggleSelectOne(enrollment.id)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {enrollment.student?.profile_photo ? (
                                                            <img src={`/storage/${enrollment.student.profile_photo}`} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium shrink-0">
                                                                {studentName(enrollment.student).charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{studentName(enrollment.student)}</div>
                                                            <div className="text-sm text-gray-500">{enrollment.student?.admission_number || enrollment.student?.user?.email || '—'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">{groupLabel(enrollment.class_section_group)}</td>
                                                <td className="px-6 py-4">{enrollment.roll_number ?? '—'}</td>
                                                <td className="px-6 py-4">{enrollment.admission_date ? enrollment.admission_date.split('T')[0] : '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${enrollment.status === 'active' ? 'bg-green-100 text-green-800' : enrollment.status === 'promoted' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {enrollment.status || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={route('academic.enrollments.show', enrollment.id)} className="text-gray-500 hover:text-gray-700 mr-3" title="View"><FontAwesomeIcon icon={faEye} className="text-sm" /></Link>
                                                    <button type="button" onClick={() => openEdit(enrollment)} className="text-amber-500 hover:text-amber-600 mr-3" title="Edit"><FontAwesomeIcon icon={faPen} className="text-sm" /></button>
                                                    <button type="button" onClick={() => setDeleteEnrollment(enrollment)} className="text-red-500 hover:text-red-600" title="Delete"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
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
                                    <Link key={i} href={link.url} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} preserveState>
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

                    {/* Add Enrollment Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Add Enrollment</h2>
                                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 p-1">✕</button>
                                </div>
                                <form onSubmit={submitAdd}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Student *</label>
                                            <SearchableSelect
                                                options={studentOptions}
                                                value={addForm.data.student_id}
                                                onChange={(id) => addForm.setData('student_id', id)}
                                                placeholder="Search student..."
                                                inputClassName={inputClass(addForm.errors.student_id)}
                                                emptyText={unenrolledStudents.length === 0 ? 'All students are already enrolled' : 'No student found'}
                                            />
                                            {unenrolledStudents.length === 0 && <p className="text-amber-600 text-sm mt-1">All students are already enrolled.</p>}
                                            {addForm.errors.student_id && <p className="text-red-500 text-sm mt-1">{addForm.errors.student_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group *</label>
                                            <SearchableSelect
                                                options={groupOptions}
                                                value={addForm.data.class_section_group_id}
                                                onChange={(id) => addForm.setData('class_section_group_id', id)}
                                                placeholder="Search class · section · group..."
                                                inputClassName={inputClass(addForm.errors.class_section_group_id)}
                                            />
                                            {addForm.errors.class_section_group_id && <p className="text-red-500 text-sm mt-1">{addForm.errors.class_section_group_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                                            <input type="text" className={inputClass()} value={addForm.data.roll_number} onChange={(e) => addForm.setData('roll_number', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Admission Date</label>
                                            <input type="date" className={inputClass()} value={addForm.data.admission_date} onChange={(e) => addForm.setData('admission_date', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <SearchableSelect
                                                options={enrollmentStatusOptions}
                                                value={addForm.data.status}
                                                onChange={(id) => addForm.setData('status', id)}
                                                placeholder="Select status..."
                                                inputClassName={inputClass()}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                                        <button type="submit" disabled={addForm.processing} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50">{addForm.processing ? 'Saving...' : 'Save'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Enrollment Modal */}
                    {editEnrollment && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Edit Enrollment</h2>
                                    <button type="button" onClick={() => setEditEnrollment(null)} className="text-gray-500 hover:text-gray-700 p-1">✕</button>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">Student: <strong>{studentName(editEnrollment.student)}</strong></p>
                                <form onSubmit={submitEdit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group *</label>
                                            <SearchableSelect
                                                options={groupOptions}
                                                value={editForm.data.class_section_group_id}
                                                onChange={(id) => editForm.setData('class_section_group_id', id)}
                                                placeholder="Search class · section · group..."
                                                inputClassName={inputClass(editForm.errors.class_section_group_id)}
                                            />
                                            {editForm.errors.class_section_group_id && <p className="text-red-500 text-sm mt-1">{editForm.errors.class_section_group_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                                            <input type="text" className={inputClass()} value={editForm.data.roll_number} onChange={(e) => editForm.setData('roll_number', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Admission Date</label>
                                            <input type="date" className={inputClass()} value={editForm.data.admission_date} onChange={(e) => editForm.setData('admission_date', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                            <SearchableSelect
                                                options={enrollmentStatusOptions}
                                                value={editForm.data.status}
                                                onChange={(id) => editForm.setData('status', id)}
                                                placeholder="Select status..."
                                                inputClassName={inputClass()}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => setEditEnrollment(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                                        <button type="submit" disabled={editForm.processing} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50">{editForm.processing ? 'Updating...' : 'Update'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Delete confirmation modal */}
                    {deleteEnrollment && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Enrollment</h2>
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to remove <strong>{studentName(deleteEnrollment.student)}</strong> from this class? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setDeleteEnrollment(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                                    <button type="button" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg">Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
