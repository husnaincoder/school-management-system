import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function TimetableForm({ academicSessions = [], classSectionGroups = [], statuses = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        class_section_group_id: '',
        academic_session_id: academicSessions[0] ? String(academicSessions[0].id) : '',
        name: '',
        status: 'draft',
        is_active: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('academic.timetables.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Timetable" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-3">
                        <Link href={route('academic.timetables.index')} className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </Link>
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                            <FontAwesomeIcon icon={faCalendarCheck} className="text-amber-500 text-xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Add Timetable</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Create the master record, then open the weekly builder</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 max-w-xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Session *</label>
                                <select
                                    value={data.academic_session_id}
                                    onChange={(e) => setData('academic_session_id', e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 ${errors.academic_session_id ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                >
                                    <option value="">Select session</option>
                                    {academicSessions.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                                </select>
                                {errors.academic_session_id && <p className="text-red-500 text-sm mt-1">{errors.academic_session_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group *</label>
                                <select
                                    value={data.class_section_group_id}
                                    onChange={(e) => setData('class_section_group_id', e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 ${errors.class_section_group_id ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                >
                                    <option value="">Select group</option>
                                    {classSectionGroups.map((g) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
                                </select>
                                {errors.class_section_group_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_group_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name (optional)</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    placeholder="e.g. Class 10-A Science"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    {(statuses.length ? statuses : ['draft', 'published', 'archived']).map((s) => (
                                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Draft while building; publish when ready for teachers/students.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Link href={route('academic.timetables.index')} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</Link>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
                                    Create & Open Builder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
