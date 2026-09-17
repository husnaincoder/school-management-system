import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import ClassSectionGroupSelect from '@/Components/Dashboard/ClassSectionGroupSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faGraduationCap, faSave } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

function studentName(student) {
    if (!student) return '—';
    const name = [student.first_name, student.last_name].filter(Boolean).join(' ');
    return name || student.user?.name || student.user?.email || '—';
}

export default function PromotionCreate({ enrollments = [], classSectionGroups = [] }) {
    const enrollmentsList = Array.isArray(enrollments) ? enrollments : [];
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const [studentResults, setStudentResults] = useState({});

    const form = useForm({
        from_class_section_group_id: '',
        to_class_section_group_id: '',
        promotion_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        students: [],
    });

    const classStudents = form.data.from_class_section_group_id
        ? enrollmentsList.filter(
            (en) => String(en.class_section_group_id) === String(form.data.from_class_section_group_id)
        )
        : [];

    const passCount = classStudents.filter((en) => studentResults[en.id] === 'pass').length;
    const failCount = classStudents.filter((en) => studentResults[en.id] === 'fail').length;

    const handleFromGroupChange = (groupId) => {
        form.setData('from_class_section_group_id', groupId);
        const studentsInGroup = enrollmentsList.filter(
            (en) => String(en.class_section_group_id) === String(groupId)
        );
        const defaults = {};
        studentsInGroup.forEach((en) => {
            defaults[en.id] = 'pass';
        });
        setStudentResults(defaults);
    };

    const setAllResults = (result) => {
        const next = {};
        classStudents.forEach((en) => {
            next[en.id] = result;
        });
        setStudentResults(next);
    };

    const submit = (e) => {
        e.preventDefault();
        const students = classStudents.map((en) => ({
            enrollment_id: en.id,
            result: studentResults[en.id] ?? 'fail',
        }));

        form.transform((data) => ({ ...data, students }));
        form.post(route('academic.promotions.store-bulk'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Promotion" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Promotions', href: route('academic.promotions') },
                            { label: 'Class Promotion' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Promotion</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Select Pass to promote or Fail to retain in the same class</p>
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
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ClassSectionGroupSelect
                                    groups={groups}
                                    value={form.data.from_class_section_group_id}
                                    onChange={handleFromGroupChange}
                                    error={form.errors.from_class_section_group_id}
                                    inputClass={inputClass}
                                    label="From class section group"
                                    placeholder="Search current class..."
                                    required
                                />
                                <ClassSectionGroupSelect
                                    groups={groups}
                                    value={form.data.to_class_section_group_id}
                                    onChange={(id) => form.setData('to_class_section_group_id', id)}
                                    error={form.errors.to_class_section_group_id}
                                    inputClass={inputClass}
                                    label="To class section group"
                                    placeholder="Search promoted class..."
                                    excludeIds={form.data.from_class_section_group_id ? [form.data.from_class_section_group_id] : []}
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
                                    <input
                                        type="text"
                                        className={inputClass(form.errors.remarks)}
                                        value={form.data.remarks}
                                        onChange={(e) => form.setData('remarks', e.target.value)}
                                        placeholder="Optional notes"
                                    />
                                    {form.errors.remarks && <p className="text-red-500 text-sm mt-1">{form.errors.remarks}</p>}
                                </div>
                            </div>
                        </div>

                        {form.data.from_class_section_group_id && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-900">Students in class</h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {classStudents.length} student(s) · Pass: {passCount} · Fail: {failCount}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setAllResults('pass')} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                                            All Pass
                                        </button>
                                        <button type="button" onClick={() => setAllResults('fail')} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                                            All Fail
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {classStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">No students in this class.</td>
                                                </tr>
                                            ) : (
                                                classStudents.map((en) => (
                                                    <tr key={en.id} className="hover:bg-gray-50/80">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{studentName(en.student)}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">{en.roll_number ?? en.student?.admission_number ?? '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-wrap gap-4">
                                                                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`result-${en.id}`}
                                                                        value="pass"
                                                                        checked={studentResults[en.id] === 'pass'}
                                                                        onChange={() => setStudentResults((prev) => ({ ...prev, [en.id]: 'pass' }))}
                                                                        className="text-green-600 focus:ring-green-500"
                                                                    />
                                                                    <span className="text-green-700 font-medium">Pass (Promote)</span>
                                                                </label>
                                                                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`result-${en.id}`}
                                                                        value="fail"
                                                                        checked={studentResults[en.id] === 'fail'}
                                                                        onChange={() => setStudentResults((prev) => ({ ...prev, [en.id]: 'fail' }))}
                                                                        className="text-red-600 focus:ring-red-500"
                                                                    />
                                                                    <span className="text-red-700 font-medium">Fail (Retain)</span>
                                                                </label>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {form.errors.students && <p className="text-red-500 text-sm">{form.errors.students}</p>}

                        <div className="flex items-center justify-end gap-3">
                            <Link href={route('academic.promotions')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={form.processing || classStudents.length === 0 || passCount === 0}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faSave} className="text-xs" />
                                {form.processing ? 'Promoting...' : `Promote ${passCount} Student(s)`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
