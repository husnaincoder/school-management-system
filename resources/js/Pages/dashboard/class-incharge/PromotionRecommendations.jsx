import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function PromotionRecommendations({ recommendations, enrollments = [] }) {
    const rows = recommendations?.data ?? recommendations ?? [];
    const { data, setData, post, processing, reset, errors } = useForm({
        student_enrollment_id: '',
        recommendation: 'promote',
        remarks: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('class-incharge.promotion-recommendations.store'), { onSuccess: () => reset() });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Promotion Recommendations" />
            <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <Link href={route('class-incharge.dashboard')} className="text-sm text-gray-500">← Dashboard</Link>
                <h1 className="text-2xl font-bold mt-2 mb-2">Promotion Recommendations</h1>
                <p className="text-sm text-gray-500 mb-6">Recommendations only — final promotion approval remains with admin.</p>

                <form onSubmit={submit} className="bg-white border rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <select className="border rounded-lg px-3 py-2" value={data.student_enrollment_id} onChange={(e) => setData('student_enrollment_id', e.target.value)}>
                        <option value="">Student…</option>
                        {enrollments.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                    </select>
                    <select className="border rounded-lg px-3 py-2" value={data.recommendation} onChange={(e) => setData('recommendation', e.target.value)}>
                        <option value="promote">Promote</option>
                        <option value="retain">Retain</option>
                        <option value="conditional">Conditional</option>
                    </select>
                    <input className="border rounded-lg px-3 py-2" placeholder="Remarks" value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} />
                    <button disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Submit</button>
                    {errors.student_enrollment_id && <p className="text-red-500 text-xs md:col-span-4">{errors.student_enrollment_id}</p>}
                </form>

                <div className="bg-white border rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-4 py-3 text-left">Student</th>
                            <th className="px-4 py-3 text-left">Recommendation</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Remarks</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {rows.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No recommendations yet.</td></tr>
                            ) : rows.map((r) => {
                                const en = r.enrollment;
                                const name = en?.student?.full_name || en?.student?.user?.name || '—';
                                return (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">{name}</td>
                                        <td className="px-4 py-3 capitalize">{r.recommendation}</td>
                                        <td className="px-4 py-3 capitalize">{r.status}</td>
                                        <td className="px-4 py-3">{r.remarks || '—'}</td>
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
