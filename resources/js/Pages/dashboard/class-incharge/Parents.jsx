import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Parents({ parents = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Parent Communication" />
            <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <Link href={route('class-incharge.dashboard')} className="text-sm text-gray-500">← Dashboard</Link>
                <h1 className="text-2xl font-bold mt-2 mb-2">Parents / Guardians</h1>
                <p className="text-sm text-gray-500 mb-6">Contacts for students in your assigned class only. Use Announcements to notify parents.</p>
                <div className="bg-white border rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Class</th>
                            <th className="px-4 py-3 text-left">Parent</th>
                            <th className="px-4 py-3 text-left">Phone</th>
                            <th className="px-4 py-3 text-left">Email</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {parents.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No parents found for your class.</td></tr>
                            ) : parents.map((p) => (
                                <tr key={p.enrollment_id}>
                                    <td className="px-4 py-3">{p.student} <span className="text-gray-400">(#{p.roll_number})</span></td>
                                    <td className="px-4 py-3">{p.class}</td>
                                    <td className="px-4 py-3">{p.parent_name}{p.spouse_name && p.spouse_name !== '—' ? ` / ${p.spouse_name}` : ''}</td>
                                    <td className="px-4 py-3">{p.phone}</td>
                                    <td className="px-4 py-3">{p.email}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
