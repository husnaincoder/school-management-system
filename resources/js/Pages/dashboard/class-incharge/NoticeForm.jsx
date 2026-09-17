import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function NoticeForm({ notice = null, groups = [] }) {
    const { data, setData, post, put, processing, errors } = useForm({
        class_section_group_id: notice?.class_section_group_id ?? '',
        title: notice?.title ?? '',
        body: notice?.body ?? '',
        notify_parents: notice?.notify_parents ?? false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (notice) put(route('class-incharge.notices.update', notice.id));
        else post(route('class-incharge.notices.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title={notice ? 'Edit Announcement' : 'New Announcement'} />
            <div className="py-8 max-w-3xl mx-auto sm:px-6 lg:px-8">
                <Link href={route('class-incharge.notices.index')} className="text-sm text-gray-500">← Announcements</Link>
                <h1 className="text-2xl font-bold mt-2 mb-6">{notice ? 'Edit' : 'New'} Announcement</h1>
                <form onSubmit={submit} className="bg-white border rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Class group</label>
                        <select className="w-full border rounded-lg px-3 py-2" value={data.class_section_group_id} onChange={(e) => setData('class_section_group_id', e.target.value)}>
                            <option value="">Select…</option>
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                        {errors.class_section_group_id && <p className="text-red-500 text-xs mt-1">{errors.class_section_group_id}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Body</label>
                        <textarea className="w-full border rounded-lg px-3 py-2" rows={5} value={data.body} onChange={(e) => setData('body', e.target.value)} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!data.notify_parents} onChange={(e) => setData('notify_parents', e.target.checked)} />
                        Notify parents
                    </label>
                    <button disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded-lg">{notice ? 'Update' : 'Post'}</button>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
