import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import ClassSectionGroupSelect, { groupLabel } from '@/Components/Dashboard/ClassSectionGroupSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faGraduationCap, faSave } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

function studentName(student) {
    if (!student) return '—';
    const name = [student.first_name, student.last_name].filter(Boolean).join(' ');
    return name || student.user?.name || student.user?.email || '—';
}

export default function PromotionEdit({ promotion, classSectionGroups = [] }) {
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const student = promotion?.student;
    const currentEnrollment = student?.enrollment;
    const currentToGroup = promotion?.to_class_section_group ?? promotion?.toClassSectionGroup;

    const form = useForm({
        to_class_section_group_id: String(promotion?.to_class_section_group_id ?? ''),
        promotion_date: promotion?.promotion_date ? promotion.promotion_date.split('T')[0] : '',
        remarks: promotion?.remarks ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.patch(route('academic.promotions.update', promotion.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Promotion" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Promotions', href: route('academic.promotions') },
                            { label: 'Edit Promotion' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Promotion</h1>
                                <p className="text-sm text-gray-500 mt-0.5">{studentName(student)}</p>
                            </div>
                        </div>
                        <Link
                            href={route('academic.promotions')}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Student</p>
                                    <p className="text-sm font-semibold text-gray-900 mt-1">{studentName(student)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Promoted by</p>
                                    <p className="text-sm text-gray-900 mt-1">{promotion?.promoted_by_user?.name ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Current class</p>
                                    <p className="text-sm text-gray-900 mt-1">{groupLabel(currentToGroup)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Roll no</p>
                                    <p className="text-sm text-gray-900 mt-1">{currentEnrollment?.roll_number ?? student?.admission_number ?? '—'}</p>
                                </div>
                            </div>

                            <ClassSectionGroupSelect
                                groups={groups}
                                value={form.data.to_class_section_group_id}
                                onChange={(id) => form.setData('to_class_section_group_id', id)}
                                error={form.errors.to_class_section_group_id}
                                inputClass={inputClass}
                                label="To class section group"
                                placeholder="Search promoted class..."
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Promotion date</label>
                                <input
                                    type="date"
                                    className={inputClass(form.errors.promotion_date)}
                                    value={form.data.promotion_date}
                                    onChange={(e) => form.setData('promotion_date', e.target.value)}
                                />
                                {form.errors.promotion_date && <p className="text-red-500 text-sm mt-1">{form.errors.promotion_date}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <textarea
                                    rows={3}
                                    className={inputClass(form.errors.remarks)}
                                    value={form.data.remarks}
                                    onChange={(e) => form.setData('remarks', e.target.value)}
                                    placeholder="Optional notes"
                                />
                                {form.errors.remarks && <p className="text-red-500 text-sm mt-1">{form.errors.remarks}</p>}
                            </div>

                            <p className="text-xs text-gray-500">
                                Changing the target class will update the student&apos;s enrollment, roll number, and academic session.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Link href={route('academic.promotions')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faSave} className="text-xs" />
                                {form.processing ? 'Saving...' : 'Update'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
