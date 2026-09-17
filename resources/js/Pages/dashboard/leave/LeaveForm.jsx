import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = {
    leave_type_id: '',
    applicant_type: 'teacher',
    student_enrollment_id: '',
    teacher_id: '',
    employee_id: '',
    start_date: '',
    end_date: '',
    reason: '',
};

const selectInputClass = (hasError = false) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

/** Normalize date to YYYY-MM-DD for input type="date" (handles ISO string or already YYYY-MM-DD). */
function toDateOnly(value) {
    if (!value) return '';
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return s.slice(0, 10);
}

export default function LeaveForm({ leave, leaveTypes = [], teachers = [], employees = [], enrollments = [], isEdit = false }) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });

    const leaveData = leave ? {
        leave_type_id: String(leave.leave_type_id ?? leave.leaveType?.id ?? ''),
        applicant_type: leave.student_enrollment_id ? 'student' : leave.teacher_id ? 'teacher' : 'employee',
        student_enrollment_id: leave.student_enrollment_id ? String(leave.student_enrollment_id) : '',
        teacher_id: leave.teacher_id ? String(leave.teacher_id) : '',
        employee_id: leave.employee_id ? String(leave.employee_id) : '',
        start_date: toDateOnly(leave.start_date),
        end_date: toDateOnly(leave.end_date),
        reason: leave.reason ?? '',
    } : emptyForm;

    const { data, setData, post, put, processing, errors } = useForm(leaveData);

    const leaveTypeOptions = useMemo(
        () =>
            (leaveTypes || []).map((lt) => ({
                value: String(lt.id),
                label: lt.name,
                searchText: lt.name,
            })),
        [leaveTypes]
    );

    const applicantTypeOptions = useMemo(
        () => [
            { value: 'student', label: 'Student', searchText: 'student' },
            { value: 'teacher', label: 'Teacher', searchText: 'teacher' },
            { value: 'employee', label: 'Employee', searchText: 'employee' },
        ],
        []
    );

    const studentOptions = useMemo(
        () =>
            (enrollments || []).map((e) => ({
                value: String(e.id),
                label: `${e.name}${e.class_section ? ` (${e.class_section})` : ''}`,
                searchText: `${e.name} ${e.class_section || ''}`,
            })),
        [enrollments]
    );

    const teacherOptions = useMemo(
        () =>
            (teachers || []).map((t) => ({
                value: String(t.id),
                label: t.name,
                searchText: t.name,
            })),
        [teachers]
    );

    const employeeOptions = useMemo(
        () =>
            (employees || []).map((e) => ({
                value: String(e.id),
                label: e.name,
                searchText: e.name,
            })),
        [employees]
    );

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const onApplicantTypeChange = (value) => {
        setData({
            ...data,
            applicant_type: value || 'teacher',
            student_enrollment_id: '',
            teacher_id: '',
            employee_id: '',
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit && leave) {
            put(route('leaves.update', leave.id));
        } else {
            post(route('leaves.store'));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Leave" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            role="alert"
                        >
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Leave Management', href: route('admin.leave-management') },
                            { label: 'Leave Applications', href: route('leaves.index') },
                            { label: isEdit ? 'Edit Leave' : 'Add Leave' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Leave' : 'Add Leave Application'}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Apply for or edit a leave request.</p>
                            </div>
                        </div>
                        <Link
                            href={isEdit && leave ? route('leaves.show', leave.id) : route('leaves.index')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={leaveTypeOptions}
                                    value={data.leave_type_id ? String(data.leave_type_id) : ''}
                                    onChange={(value) => setData('leave_type_id', value)}
                                    placeholder="Search leave type..."
                                    inputClassName={selectInputClass(!!errors.leave_type_id)}
                                    emptyText="No leave types found"
                                />
                                {errors.leave_type_id && <p className="text-red-500 text-sm mt-1">{errors.leave_type_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Applicant Type <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={applicantTypeOptions}
                                    value={data.applicant_type || 'teacher'}
                                    onChange={onApplicantTypeChange}
                                    placeholder="Search applicant type..."
                                    inputClassName={selectInputClass()}
                                    emptyText="No applicant types found"
                                />
                            </div>

                            {data.applicant_type === 'student' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Student (Enrollment)</label>
                                    <SearchableSelect
                                        options={studentOptions}
                                        value={data.student_enrollment_id ? String(data.student_enrollment_id) : ''}
                                        onChange={(value) => setData('student_enrollment_id', value)}
                                        placeholder="Search student..."
                                        inputClassName={selectInputClass(!!errors.student_enrollment_id)}
                                        emptyText="No students found"
                                    />
                                    {errors.student_enrollment_id && <p className="text-red-500 text-sm mt-1">{errors.student_enrollment_id}</p>}
                                </div>
                            )}
                            {data.applicant_type === 'teacher' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                                    <SearchableSelect
                                        options={teacherOptions}
                                        value={data.teacher_id ? String(data.teacher_id) : ''}
                                        onChange={(value) => setData('teacher_id', value)}
                                        placeholder="Search teacher..."
                                        inputClassName={selectInputClass(!!errors.teacher_id)}
                                        emptyText="No teachers found"
                                    />
                                    {errors.teacher_id && <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>}
                                </div>
                            )}
                            {data.applicant_type === 'employee' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                                    <SearchableSelect
                                        options={employeeOptions}
                                        value={data.employee_id ? String(data.employee_id) : ''}
                                        onChange={(value) => setData('employee_id', value)}
                                        placeholder="Search employee..."
                                        inputClassName={selectInputClass(!!errors.employee_id)}
                                        emptyText="No employees found"
                                    />
                                    {errors.employee_id && <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className={`w-full border rounded-md px-3 py-2 ${errors.start_date ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                    />
                                    {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className={`w-full border rounded-md px-3 py-2 ${errors.end_date ? 'border-red-500' : 'border-gray-300'}`}
                                        required
                                    />
                                    {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                                <textarea
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={3}
                                    className={`w-full border rounded-md px-3 py-2 ${errors.reason ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="Optional reason for leave"
                                />
                                {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Link
                                    href={isEdit && leave ? route('leaves.show', leave.id) : route('leaves.index')}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </Link>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                                    {isEdit ? 'Update' : 'Create'} Leave
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
