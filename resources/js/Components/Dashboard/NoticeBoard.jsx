import { Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faThumbtack } from '@fortawesome/free-solid-svg-icons';

function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
}

const FALLBACK_COLORS = ['#3b82f6', '#eab308', '#ec4899', '#22c55e', '#f97316'];

export default function NoticeBoard({ notices = [] }) {
    const list = Array.isArray(notices) ? notices : [];

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Notice Board</h3>
                <Link
                    href={route('notices.index')}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                    View all
                </Link>
            </div>

            {list.length === 0 ? (
                <div className="py-8 text-center">
                    <p className="text-sm text-slate-500">No published notices yet.</p>
                    <Link
                        href={route('notices.index')}
                        className="inline-block mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                        Go to Notices
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {list.map((notice, i) => (
                        <Link
                            key={notice.id}
                            href={route('notices.show', notice.id)}
                            className="flex pl-0 py-2 hover:bg-slate-50 rounded-lg transition-colors -mx-2 px-2"
                        >
                            <div
                                className="w-1 shrink-0 rounded-full self-stretch min-h-[60px]"
                                style={{ backgroundColor: notice.barColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                            />
                            <div className="pl-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs text-slate-500">{notice.date}</p>
                                    {notice.isPinned && (
                                        <FontAwesomeIcon icon={faThumbtack} className="text-amber-500 w-3 h-3" title="Pinned" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-800 font-medium mb-1 line-clamp-2">{notice.title}</p>
                                <p className="text-xs text-slate-500 truncate">
                                    {notice.author} / {timeAgo(notice.publishedAt)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
