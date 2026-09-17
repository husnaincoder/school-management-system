import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faPlus, faTrashCan, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const TARGET_TYPES = [
    'All Students Enrolled in a Class',
    'All Teachers Teaching a Class',
    'All Parents of a Student enrolled in a Class',
    'All Employees Working in a Department',
    'Specific teacher',
    'Specific employee',
    'Specific parent',
    'Specific student',
];

const emptyDetail = () => ({
    class_section_group_id: '',
    student_enrollment_id: '',
    teacher_id: '',
    employee_id: '',
    parent_id: '',
    department: '',
});
const emptyTarget = () => ({ target_type: TARGET_TYPES[0], details: [emptyDetail()] });

const selectInputClass = (hasError = false) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

function groupLabel(g) {
    const cs = g.class_section || g.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const session = cs?.academic_session?.name || cs?.academicSession?.name || '';
    const grp = g.subject_group?.name || g.subjectGroup?.name || '';
    const parts = [session, cls, sec, grp].filter(Boolean);
    return parts.length ? parts.join(' · ') : `Group #${g.id}`;
}

export default function NoticeForm({
    notice = null,
    categories = [],
    classSectionGroups = [],
    teachers = [],
    employees = [],
    parents = [],
    enrollments = [],
    targetTypes = [],
}) {
    const isEdit = !!notice;
    const [targets, setTargets] = useState(() => {
        if (notice?.targets?.length) {
            return notice.targets.map((t) => ({
                target_type: t.target_type,
                details: t.details?.length
                    ? t.details.map((d) => ({
                        class_section_group_id: d.class_section_group_id != null ? String(d.class_section_group_id) : '',
                        student_enrollment_id: d.student_enrollment_id != null ? String(d.student_enrollment_id) : '',
                        teacher_id: d.teacher_id != null ? String(d.teacher_id) : '',
                        employee_id: d.employee_id != null ? String(d.employee_id) : '',
                        parent_id: d.parent_id != null ? String(d.parent_id) : '',
                        department: d.department || '',
                    }))
                    : [emptyDetail()],
            }));
        }
        return [emptyTarget()];
    });

    const { data, setData, put, processing, errors } = useForm({
        title: notice?.title ?? '',
        description: notice?.description ?? '',
        category_id: notice?.category_id != null ? String(notice.category_id) : '',
        is_pinned: notice?.is_pinned ?? false,
        priority: notice?.priority ?? 'medium',
        allow_comments: notice?.allow_comments ?? true,
        allow_likes: notice?.allow_likes ?? true,
        is_published: notice?.is_published ?? true,
        publish_at: notice?.publish_at ?? '',
        expire_at: notice?.expire_at ?? '',
    });

    const categoryOptions = useMemo(
        () => [
            { value: '', label: '— None —', searchText: 'none' },
            ...(categories || []).map((c) => ({
                value: String(c.id),
                label: c.name,
                searchText: c.name,
            })),
        ],
        [categories]
    );

    const priorityOptions = useMemo(
        () => [
            { value: 'low', label: 'Low', searchText: 'low' },
            { value: 'medium', label: 'Medium', searchText: 'medium' },
            { value: 'high', label: 'High', searchText: 'high' },
            { value: 'urgent', label: 'Urgent', searchText: 'urgent' },
        ],
        []
    );

    const targetTypeOptions = useMemo(
        () =>
            (targetTypes.length ? targetTypes : TARGET_TYPES).map((tt) => ({
                value: tt,
                label: tt,
                searchText: tt,
            })),
        [targetTypes]
    );

    const classGroupOptions = useMemo(
        () => [
            { value: '', label: '— Select group —', searchText: 'none' },
            ...(classSectionGroups || []).map((g) => {
                const label = groupLabel(g);
                return { value: String(g.id), label, searchText: label };
            }),
        ],
        [classSectionGroups]
    );

    const teacherOptions = useMemo(
        () => [
            { value: '', label: '— Select teacher —', searchText: 'none' },
            ...(teachers || []).map((te) => ({
                value: String(te.id),
                label: te.user?.name || `Teacher #${te.id}`,
                searchText: te.user?.name || '',
            })),
        ],
        [teachers]
    );

    const employeeOptions = useMemo(
        () => [
            { value: '', label: '— Select employee —', searchText: 'none' },
            ...(employees || []).map((em) => ({
                value: String(em.id),
                label: em.user?.name || `Employee #${em.id}`,
                searchText: em.user?.name || '',
            })),
        ],
        [employees]
    );

    const parentOptions = useMemo(
        () => [
            { value: '', label: '— Select parent —', searchText: 'none' },
            ...(parents || []).map((p) => ({
                value: String(p.id),
                label: p.user?.name || `Parent #${p.id}`,
                searchText: p.user?.name || '',
            })),
        ],
        [parents]
    );

    const enrollmentOptions = useMemo(
        () => [
            { value: '', label: '— Select student —', searchText: 'none' },
            ...(enrollments || []).map((en) => {
                const name = en.student?.user?.name
                    || [en.student?.first_name, en.student?.last_name].filter(Boolean).join(' ')
                    || `Enrollment #${en.id}`;
                const roll = en.roll_number ? ` (Roll: ${en.roll_number})` : '';
                const label = `${name}${roll}`;
                return { value: String(en.id), label, searchText: `${name} ${en.roll_number || ''}` };
            }),
        ],
        [enrollments]
    );

    const addTarget = () => setTargets((prev) => [...prev, emptyTarget()]);
    const removeTarget = (i) => setTargets((prev) => prev.filter((_, idx) => idx !== i));
    const addDetail = (ti) => setTargets((prev) => {
        const next = [...prev];
        next[ti].details = [...(next[ti].details || []), emptyDetail()];
        return next;
    });
    const removeDetail = (ti, di) => setTargets((prev) => {
        const next = [...prev];
        next[ti].details = next[ti].details.filter((_, idx) => idx !== di);
        if (next[ti].details.length === 0) next[ti].details = [emptyDetail()];
        return next;
    });
    const updateTargetType = (ti, v) => setTargets((prev) => {
        const next = [...prev];
        next[ti].target_type = v || TARGET_TYPES[0];
        return next;
    });
    const updateDetail = (ti, di, field, value) => setTargets((prev) => {
        const next = [...prev];
        next[ti].details[di] = { ...next[ti].details[di], [field]: value };
        return next;
    });

    const [attachmentFiles, setAttachmentFiles] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...data, targets };
        if (isEdit) {
            put(route('notices.update', notice.id), { data: payload, preserveScroll: true });
        } else {
            const formData = new FormData();
            formData.append('title', payload.title);
            formData.append('description', payload.description);
            if (payload.category_id) formData.append('category_id', payload.category_id);
            formData.append('is_pinned', payload.is_pinned ? '1' : '0');
            formData.append('priority', payload.priority);
            formData.append('allow_comments', payload.allow_comments ? '1' : '0');
            formData.append('allow_likes', payload.allow_likes ? '1' : '0');
            formData.append('is_published', payload.is_published ? '1' : '0');
            if (payload.publish_at) formData.append('publish_at', payload.publish_at);
            if (payload.expire_at) formData.append('expire_at', payload.expire_at);
            formData.append('targets', JSON.stringify(payload.targets));
            for (let i = 0; i < attachmentFiles.length; i++) {
                formData.append('attachments[]', attachmentFiles[i]);
            }
            router.post(route('notices.store'), formData, { preserveScroll: true, forceFormData: true });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Notice" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Notice Management', href: route('admin.notice-management') },
                            { label: 'Notices', href: route('notices.index') },
                            { label: isEdit ? 'Edit Notice' : 'Create Notice' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faBell} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Notice' : 'Create Notice'}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Target students, teachers, parents or employees.</p>
                            </div>
                        </div>
                        <Link
                            href={route('notices.index')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        value={data.category_id ? String(data.category_id) : ''}
                                        onChange={(value) => setData('category_id', value)}
                                        placeholder="Search category..."
                                        inputClassName={selectInputClass()}
                                        emptyText="No categories found"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <SearchableSelect
                                        options={priorityOptions}
                                        value={data.priority || 'medium'}
                                        onChange={(value) => setData('priority', value || 'medium')}
                                        placeholder="Search priority..."
                                        inputClassName={selectInputClass()}
                                        emptyText="No priorities found"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={data.is_pinned} onChange={(e) => setData('is_pinned', e.target.checked)} className="rounded" /> Pinned</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={data.allow_comments} onChange={(e) => setData('allow_comments', e.target.checked)} className="rounded" /> Allow comments</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={data.allow_likes} onChange={(e) => setData('allow_likes', e.target.checked)} className="rounded" /> Allow likes</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={data.is_published} onChange={(e) => setData('is_published', e.target.checked)} className="rounded" /> Published</label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Publish at</label>
                                    <input type="datetime-local" value={data.publish_at ? data.publish_at.slice(0, 16) : ''} onChange={(e) => setData('publish_at', e.target.value ? `${e.target.value}:00` : '')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expire at</label>
                                    <input type="datetime-local" value={data.expire_at ? data.expire_at.slice(0, 16) : ''} onChange={(e) => setData('expire_at', e.target.value ? `${e.target.value}:00` : '')} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Targets</h2>
                                <button type="button" onClick={addTarget} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-amber-500 text-white text-sm hover:bg-amber-600">
                                    <FontAwesomeIcon icon={faPlus} /> Add target
                                </button>
                            </div>
                            {targets.map((t, ti) => (
                                <div key={ti} className="border border-gray-200 rounded-lg p-4 mb-4 overflow-visible">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <SearchableSelect
                                                options={targetTypeOptions}
                                                value={t.target_type}
                                                onChange={(value) => updateTargetType(ti, value)}
                                                placeholder="Search target type..."
                                                inputClassName={selectInputClass()}
                                                emptyText="No target types found"
                                            />
                                        </div>
                                        {targets.length > 1 && (
                                            <button type="button" onClick={() => removeTarget(ti)} className="text-red-500 hover:text-red-700 shrink-0">
                                                <FontAwesomeIcon icon={faTrashCan} />
                                            </button>
                                        )}
                                    </div>
                                    {t.details.map((d, di) => (
                                        <div key={di} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
                                            {['All Students Enrolled in a Class', 'All Teachers Teaching a Class', 'All Parents of a Student enrolled in a Class'].includes(t.target_type) && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Class Section Group</label>
                                                    <SearchableSelect
                                                        options={classGroupOptions}
                                                        value={d.class_section_group_id ? String(d.class_section_group_id) : ''}
                                                        onChange={(value) => updateDetail(ti, di, 'class_section_group_id', value)}
                                                        placeholder="Search class section group..."
                                                        inputClassName={selectInputClass()}
                                                        emptyText="No groups found"
                                                    />
                                                </div>
                                            )}
                                            {t.target_type === 'All Employees Working in a Department' && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Department</label>
                                                    <input type="text" value={d.department} onChange={(e) => updateDetail(ti, di, 'department', e.target.value)} placeholder="Department name" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                                                </div>
                                            )}
                                            {t.target_type === 'Specific teacher' && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Teacher</label>
                                                    <SearchableSelect
                                                        options={teacherOptions}
                                                        value={d.teacher_id ? String(d.teacher_id) : ''}
                                                        onChange={(value) => updateDetail(ti, di, 'teacher_id', value)}
                                                        placeholder="Search teacher..."
                                                        inputClassName={selectInputClass()}
                                                        emptyText="No teachers found"
                                                    />
                                                </div>
                                            )}
                                            {t.target_type === 'Specific employee' && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Employee</label>
                                                    <SearchableSelect
                                                        options={employeeOptions}
                                                        value={d.employee_id ? String(d.employee_id) : ''}
                                                        onChange={(value) => updateDetail(ti, di, 'employee_id', value)}
                                                        placeholder="Search employee..."
                                                        inputClassName={selectInputClass()}
                                                        emptyText="No employees found"
                                                    />
                                                </div>
                                            )}
                                            {t.target_type === 'Specific parent' && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Parent</label>
                                                    <SearchableSelect
                                                        options={parentOptions}
                                                        value={d.parent_id ? String(d.parent_id) : ''}
                                                        onChange={(value) => updateDetail(ti, di, 'parent_id', value)}
                                                        placeholder="Search parent..."
                                                        inputClassName={selectInputClass()}
                                                        emptyText="No parents found"
                                                    />
                                                </div>
                                            )}
                                            {t.target_type === 'Specific student' && (
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">Student (Enrollment)</label>
                                                    <SearchableSelect
                                                        options={enrollmentOptions}
                                                        value={d.student_enrollment_id ? String(d.student_enrollment_id) : ''}
                                                        onChange={(value) => updateDetail(ti, di, 'student_enrollment_id', value)}
                                                        placeholder="Search student..."
                                                        inputClassName={selectInputClass()}
                                                        emptyText="No students found"
                                                    />
                                                </div>
                                            )}
                                            {t.details.length > 1 && (
                                                <div className="flex items-end">
                                                    <button type="button" onClick={() => removeDetail(ti, di)} className="text-red-500 text-sm">Remove</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addDetail(ti)} className="text-sm text-amber-600 hover:text-amber-700 hover:underline mt-2">+ Add detail row</button>
                                </div>
                            ))}
                        </div>

                        {!isEdit && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                                    onChange={(e) => setAttachmentFiles(Array.from(e.target.files || []))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">Allowed: PDF, Word, Excel, PowerPoint, images, TXT/CSV — max 10MB each</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50">{isEdit ? 'Update' : 'Create'} Notice</button>
                            <a href={isEdit ? route('notices.show', notice.id) : route('notices.index')} className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
