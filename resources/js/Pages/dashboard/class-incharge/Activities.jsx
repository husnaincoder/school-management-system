import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Activities({ activities, classSections = [] }) {
    const rows = activities?.data ?? activities ?? [];
    const [show, setShow] = useState(false);
    const { data, setData, post, processing, reset, errors } = useForm({
        class_section_id: classSections[0]?.id ?? '',
        title: '',
        description: '',
        activity_date: '',
        location: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('class-incharge.activities.store'), { onSuccess: () => { reset(); setShow(false); } });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Activities" />
            <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <Link href={route('class-incharge.dashboard')} className="text-sm text-gray-500">← Dashboard</Link>
                        <h1 className="text-2xl font-bold">Class Activities</h1>
                    </div>
                    <button type="button" onClick={() => setShow(true)} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm">Add Activity</button>
                </div>
                <div className="bg-white border rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-left">Class</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Location</th>
                            <th className="px-4 py-3 text-left"></th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No activities.</td></tr>
                            ) : rows.map((a) => {
                                const cs = a.class_section ?? a.classSection;
                                return (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 font-medium">{a.title}</td>
                                        <td className="px-4 py-3">{cs?.class?.name} - {cs?.section?.name}</td>
                                        <td className="px-4 py-3">{a.activity_date ?? '—'}</td>
                                        <td className="px-4 py-3">{a.location ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <button type="button" className="text-red-500" onClick={() => { if (confirm('Delete?')) router.delete(route('class-incharge.activities.destroy', a.id)); }}>Delete</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {show && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <form onSubmit={submit} className="bg-white rounded-xl p-6 w-full max-w-lg space-y-3">
                            <h2 className="text-lg font-semibold">New Activity</h2>
                            <select className="w-full border rounded-lg px-3 py-2" value={data.class_section_id} onChange={(e) => setData('class_section_id', e.target.value)}>
                                {classSections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                            <input className="w-full border rounded-lg px-3 py-2" placeholder="Title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                            {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
                            <textarea className="w-full border rounded-lg px-3 py-2" placeholder="Description" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                            <input type="date" className="w-full border rounded-lg px-3 py-2" value={data.activity_date} onChange={(e) => setData('activity_date', e.target.value)} />
                            <input className="w-full border rounded-lg px-3 py-2" placeholder="Location" value={data.location} onChange={(e) => setData('location', e.target.value)} />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShow(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
                                <button disabled={processing} className="px-3 py-2 bg-amber-500 text-white rounded-lg">Save</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
