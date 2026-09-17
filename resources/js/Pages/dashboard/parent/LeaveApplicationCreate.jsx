import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarXmark } from '@fortawesome/free-solid-svg-icons';

export default function LeaveApplicationCreate({ children = [], leaveTypes = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        student_enrollment_id: children[0]?.enrollment?.id ?? '',
        leave_type_id: leaveTypes[0]?.id ?? '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('parent.leave-applications.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="New Leave Application" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('parent.leave-applications.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to list</Link>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarXmark} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">New Leave Application</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Apply for leave for your child.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel htmlFor="student_enrollment_id" value="Child" className="text-gray-700" />
                                <select
                                    id="student_enrollment_id"
                                    value={data.student_enrollment_id}
                                    onChange={(e) => setData('student_enrollment_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FFA500] focus:ring-[#FFA500] text-sm"
                                    required
                                >
                                    <option value="">Select child</option>
                                    {children.map((c) => (
                                        <option key={c.enrollment.id} value={c.enrollment.id}>
                                            {c.user?.name ?? c.name} – {c.enrollment.class_label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.student_enrollment_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="leave_type_id" value="Leave type" className="text-gray-700" />
                                <select
                                    id="leave_type_id"
                                    value={data.leave_type_id}
                                    onChange={(e) => setData('leave_type_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FFA500] focus:ring-[#FFA500] text-sm"
                                    required
                                >
                                    <option value="">Select leave type</option>
                                    {(leaveTypes || []).map((lt) => (
                                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.leave_type_id} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <InputLabel htmlFor="start_date" value="From date" className="text-gray-700" />
                                    <TextInput
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-[#FFA500] focus:ring-[#FFA500]"
                                        required
                                    />
                                    <InputError message={errors.start_date} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="end_date" value="To date" className="text-gray-700" />
                                    <TextInput
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-[#FFA500] focus:ring-[#FFA500]"
                                        required
                                    />
                                    <InputError message={errors.end_date} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="reason" value="Reason (optional)" className="text-gray-700" />
                                <textarea
                                    id="reason"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    rows={4}
                                    maxLength={2000}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FFA500] focus:ring-[#FFA500] text-sm"
                                    placeholder="Reason for leave"
                                />
                                <p className="mt-1 text-xs text-gray-500">{data.reason.length}/2000</p>
                                <InputError message={errors.reason} className="mt-2" />
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <PrimaryButton
                                    type="submit"
                                    className="bg-[#FFA500] hover:bg-[#e59400] focus:ring-[#FFA500]"
                                    disabled={processing}
                                >
                                    Submit application
                                </PrimaryButton>
                                <Link
                                    href={route('parent.leave-applications.index')}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
