import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faFolderOpen, faEye, faDownload, faUpload, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const TYPES = [
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'study_material', label: 'Study Material' },
    { value: 'exam_paper', label: 'Exam Paper' },
    { value: 'other', label: 'Other' },
];

const selectInputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
        hasError ? 'border-red-500' : 'border-gray-300'
    }`;

const emptyForm = {
    title: '',
    description: '',
    type: 'study_material',
    class_section_group_subject_id: '',
    is_active: true,
    file: null,
};

function csgsLabel(csgs) {
    if (!csgs) return '—';
    const csg = csgs.class_section_group;
    const cs = csg?.class_section;
    const session = cs?.academic_session?.name ?? '';
    const c = cs?.class?.name ?? '';
    const s = cs?.section?.name ?? '';
    const sg = csg?.subject_group?.name ?? '';
    const sub = csgs.subject?.name ?? '';
    const parts = [session, c, s, sg, sub].filter(Boolean);
    return parts.length ? parts.join(' · ') : `#${csgs.id}`;
}

export default function MaterialsIndex({
    materials = [],
    classSectionGroupSubjects = [],
    filterClassSectionGroupSubjectId = '',
    filterType = '',
    canEdit = true,
}) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [viewModal, setViewModal] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const openAdd = () => {
        setEditing(null);
        setData({ ...emptyForm, file: null });
        setShowModal(true);
    };

    const openView = (row) => {
        setViewing(row);
        setViewModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setData({
            title: row.title ?? '',
            description: row.description ?? '',
            type: row.type ?? 'study_material',
            class_section_group_subject_id: row.class_section_group_subject_id ?? '',
            is_active: row.is_active ?? true,
            file: null,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('academic.materials.update', editing.id), {
                forceFormData: true,
                onSuccess: () => { setShowModal(false); setEditing(null); reset(); },
            });
        } else {
            post(route('academic.materials.store'), {
                forceFormData: true,
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (row) => {
        if (!window.confirm('Remove this material?')) return;
        router.delete(route('academic.materials.destroy', row.id));
    };

    const handleDownload = (row) => {
        window.location.href = route('academic.materials.download', row.id);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'syllabus': return 'bg-purple-100 text-purple-800';
            case 'assignment': return 'bg-yellow-100 text-yellow-800';
            case 'study_material': return 'bg-blue-100 text-blue-800';
            case 'exam_paper': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const list = Array.isArray(materials) ? materials : [];
    const csgsList = Array.isArray(classSectionGroupSubjects) ? classSectionGroupSubjects : [];

    const typeOptions = useMemo(
        () =>
            TYPES.map((t) => ({
                value: t.value,
                label: t.label,
                searchText: t.label,
                selectedLabel: t.label,
            })),
        []
    );

    const csgsOptions = useMemo(
        () =>
            csgsList.map((csgs) => {
                const label = csgsLabel(csgs);
                return {
                    value: String(csgs.id),
                    label,
                    searchText: label,
                    selectedLabel: label,
                    sublabel: csgs.subject?.name || undefined,
                };
            }),
        [csgsList]
    );

    const filterSubjectOptions = useMemo(
        () => [{ value: '', label: 'All subjects' }, ...csgsOptions],
        [csgsOptions]
    );

    const filterTypeOptions = useMemo(
        () => [{ value: '', label: 'All types' }, ...typeOptions],
        [typeOptions]
    );

    const applySubjectFilter = (value) => {
        router.get(route('academic.materials'), { class_section_group_subject_id: value || undefined, type: filterType || undefined }, { preserveState: true });
    };
    const applyTypeFilter = (value) => {
        router.get(route('academic.materials'), { type: value || undefined, class_section_group_subject_id: filterClassSectionGroupSubjectId || undefined }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
               <Head title="Materials" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Materials' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFolderOpen} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Syllabus, assignments, study materials and exam papers</p>
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

                    {/* Filters Card - only for admin/teacher */}
                    {canEdit && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                                Filters
                            </h2>
                            <div className="flex flex-wrap items-end gap-4 justify-end">
                                <div className="min-w-[220px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <SearchableSelect
                                        options={filterSubjectOptions}
                                        value={filterClassSectionGroupSubjectId || ''}
                                        onChange={applySubjectFilter}
                                        placeholder="Search subject..."
                                        inputClassName="min-w-[220px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    />
                                </div>
                                <div className="min-w-[160px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <SearchableSelect
                                        options={filterTypeOptions}
                                        value={filterType || ''}
                                        onChange={applyTypeFilter}
                                        placeholder="Search type..."
                                        inputClassName="min-w-[160px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Materials</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} material{list.length !== 1 ? 's' : ''}</p>
                            </div>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={openAdd}
                                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                    Add New Material
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject / Group</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            {canEdit ? 'No materials found. Click "Add New Material" to create one.' : 'No materials available for your class.'}
                                        </td>
                                    </tr>
                                ) : (
                                    list.map(m => (
                                        <tr key={m.id}>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900">{m.title}</span>
                                                {m.description && <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{m.description}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(m.type)}`}>{m.type?.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-6 py-4">{csgsLabel(m.class_section_group_subject || m.classSectionGroupSubject)}</td>
                                            <td className="px-6 py-4">{m.teacher_name ?? (m.class_section_group_subject || m.classSectionGroupSubject)?.teacher?.user?.name ?? (m.class_section_group_subject || m.classSectionGroupSubject)?.teacher?.staff_id ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs rounded ${m.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {m.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button type="button" onClick={() => openView(m)} className="text-gray-500 hover:text-gray-700 mr-3" title="View"><FontAwesomeIcon icon={faEye} className="text-sm" /></button>
                                                {m.file_path && (
                                                    <button type="button" onClick={() => handleDownload(m)} className="text-green-600 hover:text-green-700 mr-3" title="Download"><FontAwesomeIcon icon={faDownload} className="text-sm" /></button>
                                                )}
                                                {canEdit && (
                                                    <>
                                                        <button type="button" onClick={() => openEdit(m)} className="text-amber-500 hover:text-amber-600 mr-3" title="Edit"><FontAwesomeIcon icon={faPen} className="text-sm" /></button>
                                                        <button type="button" onClick={() => handleDelete(m)} className="text-red-500 hover:text-red-600" title="Delete"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
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
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-xl overflow-visible">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editing ? 'Edit Material' : 'Add Material'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditing(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={data.title} onChange={(e) => setData('title', e.target.value)} required />
                                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                                            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows="2" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                                <SearchableSelect
                                                    options={typeOptions}
                                                    value={data.type}
                                                    onChange={(v) => setData('type', v || 'study_material')}
                                                    placeholder="Search type..."
                                                    inputClassName={selectInputClass(!!errors.type)}
                                                    emptyText="No type found"
                                                />
                                                {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group Subject</label>
                                                <SearchableSelect
                                                    options={csgsOptions}
                                                    value={data.class_section_group_subject_id}
                                                    onChange={(id) => setData('class_section_group_subject_id', id)}
                                                    placeholder="Search class / subject..."
                                                    inputClassName={selectInputClass(!!errors.class_section_group_subject_id)}
                                                    emptyText={csgsList.length === 0 ? 'No subjects found' : 'No match found'}
                                                />
                                                {errors.class_section_group_subject_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_group_subject_id}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">File (optional){editing ? ' — leave empty to keep current' : ''}</label>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                                                onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                            />
                                            {data.file ? (
                                                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                                                    <span className="text-sm font-medium text-gray-700 truncate flex-1" title={data.file.name}>{data.file.name}</span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-amber-600 hover:text-amber-700 font-medium">Change</button>
                                                        <button type="button" onClick={() => { setData('file', null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-sm text-red-600 hover:text-red-700 font-medium">Remove</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                                                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        setIsDragging(false);
                                                        const file = e.dataTransfer.files?.[0];
                                                        if (file) setData('file', file);
                                                    }}
                                                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 py-8 px-4 text-center ${isDragging ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-gray-50/50 hover:border-amber-300 hover:bg-amber-50/30'}`}
                                                >
                                                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                            <FontAwesomeIcon icon={faUpload} className="text-xl text-gray-500" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600">
                                                            {isDragging ? 'Drop file here' : 'Drag & drop file here or click to browse'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">PDF, Word, Excel, PowerPoint, images, TXT/CSV — max 20MB</span>
                                                    </div>
                                                </div>
                                            )}
                                            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditing(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.title || !data.type || !data.class_section_group_subject_id}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {editing ? 'Update' : 'Save'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    {viewModal && viewing && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">View Material</h2>
                                    <button type="button" onClick={() => { setViewModal(false); setViewing(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase">Title</span>
                                        <p className="mt-1 font-medium">{viewing.title}</p>
                                    </div>
                                    {viewing.description && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase">Description</span>
                                            <p className="mt-1 text-gray-700 whitespace-pre-wrap">{viewing.description}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase">Type</span>
                                        <p className="mt-1">
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(viewing.type)}`}>{viewing.type?.replace('_', ' ')}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase">Subject / Group</span>
                                        <p className="mt-1 text-gray-700">{csgsLabel(viewing.class_section_group_subject || viewing.classSectionGroupSubject)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase">Teacher</span>
                                        <p className="mt-1 text-gray-700">{viewing.teacher_name ?? (viewing.class_section_group_subject || viewing.classSectionGroupSubject)?.teacher?.user?.name ?? (viewing.class_section_group_subject || viewing.classSectionGroupSubject)?.teacher?.staff_id ?? '—'}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase">Active</span>
                                        <p className="mt-1 text-gray-700">{viewing.is_active ? 'Yes' : 'No'}</p>
                                    </div>
                                    {viewing.file_path && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-500 uppercase">File</span>
                                            <p className="mt-1">
                                                <button type="button" onClick={() => handleDownload(viewing)} className="text-green-600 hover:text-green-800 font-medium">Download file</button>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => { setViewModal(false); setViewing(null); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Close</button>
                                    {canEdit && (
                                        <button type="button" onClick={() => { setViewModal(false); openEdit(viewing); }} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded">Edit</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
