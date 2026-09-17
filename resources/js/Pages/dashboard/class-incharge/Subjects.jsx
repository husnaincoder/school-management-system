import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function ClassInchargeSubjects({ classSection, subjects = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Class Subjects" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-3">
                        <Link href={route('class-incharge.dashboard')} className="text-gray-500"><FontAwesomeIcon icon={faArrowLeft} /></Link>
                        <div>
                            <h1 className="text-2xl font-bold">Subjects — {classSection?.label}</h1>
                            <p className="text-sm text-gray-500">{classSection?.session} · View only (subject teachers unchanged)</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-left">Code</th>
                                    <th className="px-4 py-3 text-left">Teacher</th>
                                    <th className="px-4 py-3 text-left">Group</th>
                                    <th className="px-4 py-3 text-left">Weekly</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {subjects.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No subjects found.</td></tr>
                                ) : subjects.map((s) => (
                                    <tr key={s.id}>
                                        <td className="px-4 py-3 font-medium">{s.subject}</td>
                                        <td className="px-4 py-3">{s.code || '—'}</td>
                                        <td className="px-4 py-3">{s.teacher}</td>
                                        <td className="px-4 py-3">{s.group || '—'}</td>
                                        <td className="px-4 py-3">{s.weekly_classes ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
