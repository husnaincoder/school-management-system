import { Link, usePage } from '@inertiajs/react';

/**
 * Resolve the role-aware dashboard home URL from shared Inertia props.
 */
export function useDashboardUrl() {
    const { dashboardUrl } = usePage().props;
    return dashboardUrl || '/dashboard';
}

/**
 * Breadcrumb items. Any crumb labeled "Dashboard" uses the current user's
 * role dashboard (not a hard-coded superadmin route).
 */
export default function PageBreadcrumbs({ items = [] }) {
    const dashboardHome = useDashboardUrl();

    if (!items.length) return null;

    const resolved = items.map((item) => {
        if (item.label !== 'Dashboard') {
            return item;
        }

        return {
            ...item,
            href: dashboardHome,
        };
    });

    return (
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
            <ol className="flex flex-wrap items-center gap-1.5">
                {resolved.map((item, index) => {
                    const isLast = index === resolved.length - 1;

                    return (
                        <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                            {index > 0 && <span aria-hidden="true">/</span>}
                            {isLast || !item.href ? (
                                <span className={isLast ? 'text-gray-900 font-medium' : ''}>{item.label}</span>
                            ) : (
                                <Link href={item.href} className="hover:text-amber-600 transition-colors">
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
