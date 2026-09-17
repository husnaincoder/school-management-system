import React from 'react';
import {Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

export default function RemarksCreate({ enrollments = [], classSectionGroups = [], remarkTypes = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        student_enrollment_id: '',
        type: 'remark',
        body: '',
        remark_date: new Date().toISOString().slice(0, 10),
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('teacher.remarks.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Remark" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Title - same as Teacher Management / Materials */}
                    <div className="mb-6">
                        <Link href={route('teacher.remarks.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to Remarks</Link>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faPenToSquare} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Add Student Remark</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Add a remark, warning, behavior note, or parent meeting note for your incharge class student.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                <select
                                    value={data.student_enrollment_id}
                                    onChange={(e) => setData('student_enrollment_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    required
                                >
                                    <option value="">Select student</option>
                                    {enrollments.map((e) => (
                                        <option key={e.id} value={e.id}>{e.label}</option>
                                    ))}
                                </select>
                                {errors.student_enrollment_id && <p className="mt-1 text-sm text-red-600">{errors.student_enrollment_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    {remarkTypes.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remark / Note</label>
                                <textarea
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    placeholder="Enter remark or note..."
                                    required
                                />
                                {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={data.remark_date}
                                    onChange={(e) => setData('remark_date', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                                {errors.remark_date && <p className="mt-1 text-sm text-red-600">{errors.remark_date}</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Remark'}
                                </button>
                                <Link href={route('teacher.remarks.index')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-sm">
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