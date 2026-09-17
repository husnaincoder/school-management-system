import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faPlus, faFilter, faEye, faPen, faTrashCan, faArrowLeft, faCopy, faCheck, faKey, faXmark, faUpload, faDownload } from '@fortawesome/free-solid-svg-icons';

export default function StudentsIndex({ students, filters = {} }) {
    const [deleteStudent, setDeleteStudent] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [credentials, setCredentials] = useState(null);
    const [copied, setCopied] = useState(false);
    const { flash } = usePage().props;

    const studentList = students?.data ?? students ?? [];
    const pagination = students?.links ? { ...students, data: undefined } : null;
    const total = students?.total ?? studentList.length;

    useEffect(() => {
        if (flash?.credentials) {
            setCredentials(flash.credentials);
        }
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 7000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error, flash?.credentials]);

    const copyCredentials = () => {
        if (!credentials) return;
        let text = `=== Student Portal Login ===\n`;
        text += `Name: ${credentials.student?.name || ''}\n`;
        text += `Login ID: ${credentials.student?.login || ''}\n`;
        if (credentials.student?.email) text += `Email: ${credentials.student?.email}\n`;
        text += `Password: ${credentials.student?.password || ''}\n`;

        if (credentials.parent && credentials.parent.password) {
            text += `\n=== Parent Portal Login ===\n`;
            text += `Name: ${credentials.parent?.name || ''}\n`;
            text += `Login ID: ${credentials.parent?.login || ''}\n`;
            if (credentials.parent?.email) text += `Email: ${credentials.parent?.email}\n`;
            text += `Password: ${credentials.parent?.password || ''}\n`;
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const filterForm = useForm({
        search: filters.search ?? '',
    });

    const submitFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filterForm.data.search) params.search = filterForm.data.search;
        router.get(route('academic.students'), params, { preserveState: true });
    };

    const confirmDelete = () => {
        if (!deleteStudent) return;
        router.delete(route('academic.students.destroy', deleteStudent.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteStudent(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg border ${banner.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            {banner.message}
                        </div>
                    )}

                    {credentials && (
                        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-3 border-b border-amber-200 pb-3">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                                    <FontAwesomeIcon icon={faKey} className="text-amber-600" />
                                    <span>Generated Account Credentials</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={copyCredentials}
                                        className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm"
                                    >
                                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                                        {copied ? 'Copied!' : 'Copy Credentials'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCredentials(null)}
                                        className="text-gray-400 hover:text-gray-600 p-1 text-sm"
                                        title="Dismiss"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {credentials.student && (
                                    <div className="bg-white/90 rounded-lg p-4 border border-amber-200">
                                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                                            Student Portal Access
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-800">
                                            <div><span className="text-gray-500 font-medium">Name:</span> <span className="font-semibold">{credentials.student.name}</span></div>
                                            <div><span className="text-gray-500 font-medium">Login ID:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900 font-mono font-bold">{credentials.student.login}</code></div>
                                            {credentials.student.email && (
                                                <div><span className="text-gray-500 font-medium">Email:</span> {credentials.student.email}</div>
                                            )}
                                            <div><span className="text-gray-500 font-medium">Password:</span> <code className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">{credentials.student.password}</code></div>
                                        </div>
                                    </div>
                                )}
                                {credentials.parent && credentials.parent.password && (
                                    <div className="bg-white/90 rounded-lg p-4 border border-amber-200">
                                        <div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                                            Parent Portal Access
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-800">
                                            <div><span className="text-gray-500 font-medium">Name:</span> <span className="font-semibold">{credentials.parent.name}</span></div>
                                            <div><span className="text-gray-500 font-medium">Login ID:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900 font-mono font-bold">{credentials.parent.login}</code></div>
                                            {credentials.parent.email && (
                                                <div><span className="text-gray-500 font-medium">Email:</span> {credentials.parent.email}</div>
                                            )}
                                            <div><span className="text-gray-500 font-medium">Password:</span> <code className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">{credentials.parent.password}</code></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Students' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage students and admissions</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.students-enrollments')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors"
                                title="Back"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            </Link>

                            <a
                                href={route('academic.students.export', filters)}
                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3.5 py-2 rounded-lg font-medium text-sm transition shadow-sm"
                                title="Export Current View to CSV"
                            >
                                <FontAwesomeIcon icon={faDownload} className="text-amber-600 text-sm" />
                                <span>Export CSV</span>
                            </a>

                            <Link
                                href={route('academic.students.import')}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-medium text-sm transition shadow-sm"
                                title="Bulk Import Students via CSV or Excel"
                            >
                                <FontAwesomeIcon icon={faUpload} className="text-sm" />
                                <span>Bulk Import</span>
                            </Link>

                            <Link
                                href={route('academic.students.create')}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
                                title="Add Single Student"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                <span>Add Student</span>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <form onSubmit={submitFilters} className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="student-search" className="text-sm font-medium text-gray-700 shrink-0">Search</label>
                                <input
                                    id="student-search"
                                    type="text"
                                    placeholder="Search by name, email, admission number, CNIC..."
                                    className="min-w-[240px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                />
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Filter
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {total} student{total !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {studentList.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No students found. Click &quot;Add Student&quot; to create one.</td>
                                        </tr>
                                    ) : (
                                        studentList.map((student) => (
                                            <tr key={student.id}>
                                                <td className="px-6 py-4">
                                                    {student.profile_photo ? (
                                                        <img src={`/storage/${student.profile_photo}`} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                                                            {[student.first_name, student.last_name].filter(Boolean).join(' ').charAt(0) || student.user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">{student.admission_number || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{[student.first_name, student.last_name].filter(Boolean).join(' ') || student.user?.name}</div>
                                                    <div className="text-sm text-gray-500">{student.user?.email}</div>
                                                </td>
                                                <td className="px-6 py-4">{student.cnic ?? '—'}</td>
                                                <td className="px-6 py-4">{student.gender ?? '—'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{student.parent?.user?.name || '—'}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.parent
                                                            ? (student.parent.relation_with_student === 'Father'
                                                                ? (student.parent.father_cnic ?? '—')
                                                                : student.parent.relation_with_student === 'Mother'
                                                                    ? (student.parent.spouse_cnic ?? '—')
                                                                    : (student.parent.father_cnic || student.parent.spouse_cnic || '—'))
                                                            : '—'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={route('academic.students.show', student.id)} className="text-gray-500 hover:text-gray-700 mr-3" title="View"><FontAwesomeIcon icon={faEye} className="text-sm" /></Link>
                                                    <Link href={route('academic.students.edit', student.id)} className="text-amber-500 hover:text-amber-600 mr-3" title="Edit"><FontAwesomeIcon icon={faPen} className="text-sm" /></Link>
                                                    <button type="button" onClick={() => setDeleteStudent(student)} className="text-red-500 hover:text-red-600" title="Delete"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
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

                    {deleteStudent && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Student</h2>
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to delete <strong>{[deleteStudent.first_name, deleteStudent.last_name].filter(Boolean).join(' ') || deleteStudent.user?.name}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setDeleteStudent(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
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
