import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons';

export default function MyLeaveCreate({ leaveTypes = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('teacher.my-leaves.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Apply for Leave" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('teacher.my-leaves.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to list</Link>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Submit a leave request. Admin will review and approve or reject.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <InputLabel htmlFor="leave_type_id" value="Leave Type" className="text-gray-700" />
                                <select
                                    id="leave_type_id"
                                    value={data.leave_type_id}
                                    onChange={(e) => setData('leave_type_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FFA500] focus:ring-[#FFA500] text-sm"
                                    required
                                >
                                    <option value="">Select leave type</option>
                                    {leaveTypes.map((lt) => (
                                        <option key={lt.id} value={lt.id}>{lt.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.leave_type_id} className="mt-2" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <InputLabel htmlFor="start_date" value="Start date" className="text-gray-700" />
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
                                    <InputLabel htmlFor="end_date" value="End date" className="text-gray-700" />
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
                                    href={route('teacher.my-leaves.index')}
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
