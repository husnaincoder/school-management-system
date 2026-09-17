import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faThumbtack, faHeart, faComment, faPen, faTrashCan, faPaperclip, faUsers, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';

const priorityClass = (p) => {
    const map = { low: 'bg-gray-100 text-gray-800', medium: 'bg-blue-100 text-blue-800', high: 'bg-amber-100 text-amber-800', urgent: 'bg-red-100 text-red-800' };
    return map[p] || 'bg-gray-100 text-gray-800';
};

export default function NoticeShow({ notice, liked, canEdit }) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, processing, errors, reset } = useForm({ comment: '' });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    if (!notice) {
        return (
            <AuthenticatedLayout>
                <div className="py-8 max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <p className="text-gray-500">Notice not found or loading...</p>
                    <a href={route('notices.index')} className="text-indigo-600 hover:underline mt-2 inline-block">Back to Notices</a>
                </div>
            </AuthenticatedLayout>
        );
    }

    const toggleLike = () => {
        router.post(route('notices.like', notice.id), {}, { preserveScroll: true });
    };

    const submitComment = (e) => {
        e.preventDefault();
        post(route('notices.comment', notice.id), { onSuccess: () => reset('comment'), preserveScroll: true });
    };

    const handleDelete = () => {
        if (!window.confirm('Delete this notice?')) return;
        router.delete(route('notices.destroy', notice.id), { onSuccess: () => router.visit(route('notices.index')) });
    };

    const reads = notice.reads || [];
    const comments = notice.comments || [];
    const attachments = notice.attachments || [];

    return (
        <AuthenticatedLayout>
            <Head title="Notice Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Notice Management', href: route('admin.notice-management') },
                            { label: 'Notices', href: route('notices.index') },
                            { label: notice.title },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faBell} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {notice.is_pinned && <span className="text-amber-500" title="Pinned"><FontAwesomeIcon icon={faThumbtack} /></span>}
                                    <h1 className="text-2xl font-bold text-gray-900">{notice.title}</h1>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityClass(notice.priority)}`}>{notice.priority}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {notice.category?.name}
                                    {notice.publish_at && ` · Published: ${new Date(notice.publish_at).toLocaleString()}`}
                                    {notice.expire_at && ` · Expires: ${new Date(notice.expire_at).toLocaleDateString()}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('notices.index')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            {canEdit && (
                                <>
                                    <Link href={route('notices.edit', notice.id)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                                        <FontAwesomeIcon icon={faPen} /> Edit
                                    </Link>
                                    <button type="button" onClick={handleDelete} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm hover:bg-red-50">
                                        <FontAwesomeIcon icon={faTrashCan} /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700">{notice.description}</div>
                        </div>
                        {attachments.length > 0 && (
                            <div className="px-6 pb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><FontAwesomeIcon icon={faPaperclip} /> Attachments</h3>
                                <ul className="space-y-1">
                                    {attachments.map((a) => (
                                        <li key={a.id}>
                                            <a href={`/storage/${a.file}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{a.original_name || a.file}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-4">
                            {notice.allow_likes && (
                                <button type="button" onClick={toggleLike} className="flex items-center gap-2 text-gray-700 hover:text-red-500">
                                    <FontAwesomeIcon icon={liked ? faHeart : faHeartRegular} className={liked ? 'text-red-500' : ''} />
                                    <span>{notice.likes?.length ?? 0} Like(s)</span>
                                </button>
                            )}
                            <span className="flex items-center gap-2 text-gray-600">
                                <FontAwesomeIcon icon={faComment} /> {comments.length} Comment(s)
                            </span>
                            <span className="flex items-center gap-2 text-gray-600">
                                <FontAwesomeIcon icon={faUsers} /> {reads.length} Read(s)
                            </span>
                        </div>
                    </div>

                    {notice.allow_comments && (
                        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
                            <form onSubmit={submitComment} className="mb-6">
                                <textarea value={data.comment} onChange={(e) => setData('comment', e.target.value)} placeholder="Write a comment..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment}</p>}
                                <button type="submit" disabled={processing} className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50">Post Comment</button>
                            </form>
                            <ul className="space-y-4">
                                {comments.map((c) => (
                                    <li key={c.id} className="border-b border-gray-100 pb-4 last:border-0">
                                        <p className="font-medium text-gray-900">{c.user?.name ?? 'User'}</p>
                                        <p className="text-sm text-gray-600 mt-0.5">{c.comment}</p>
                                        <p className="text-xs text-gray-400 mt-1">{c.commented_at ? new Date(c.commented_at).toLocaleString() : ''}</p>
                                    </li>
                                ))}
                                {comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
                            </ul>
                        </div>
                    )}

                    <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Read by ({reads.length})</h3>
                        <ul className="space-y-2">
                            {reads.slice(0, 20).map((r) => (
                                <li key={r.id} className="text-sm text-gray-600">{r.user?.name ?? '—'} {r.read_at ? new Date(r.read_at).toLocaleString() : ''}</li>
                            ))}
                            {reads.length > 20 && <li className="text-sm text-gray-500">... and {reads.length - 20} more</li>}
                            {reads.length === 0 && <p className="text-gray-500 text-sm">No read data yet.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
