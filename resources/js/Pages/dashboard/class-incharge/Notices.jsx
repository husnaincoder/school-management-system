import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Notices({ notices }) {
    const rows = notices?.data ?? notices ?? [];
    return (
        <AuthenticatedLayout>
            <Head title="Class Announcements" />
            <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <Link href={route('class-incharge.dashboard')} className="text-sm text-gray-500">← Dashboard</Link>
                        <h1 className="text-2xl font-bold">Class Announcements</h1>
                    </div>
                    <Link href={route('class-incharge.notices.create')} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm">New Announcement</Link>
                </div>
                <div className="bg-white border rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-left">Class</th>
                            <th className="px-4 py-3 text-left">Parents</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No announcements yet.</td></tr>
                            ) : rows.map((n) => {
                                const g = n.class_section_group ?? n.classSectionGroup;
                                const cs = g?.class_section ?? g?.classSection;
                                const label = `${cs?.class?.name ?? ''} - ${cs?.section?.name ?? ''}`;
                                return (
                                    <tr key={n.id}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{n.title}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{n.body}</div>
                                        </td>
                                        <td className="px-4 py-3">{label}</td>
                                        <td className="px-4 py-3">{n.notify_parents ? 'Yes' : 'No'}</td>
                                        <td className="px-4 py-3 space-x-2">
                                            <Link href={route('class-incharge.notices.edit', n.id)} className="text-amber-600">Edit</Link>
                                            <button type="button" className="text-red-500" onClick={() => { if (confirm('Delete?')) router.delete(route('class-incharge.notices.destroy', n.id)); }}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
