import Dropdown from '@/Components/Dropdown';
import GlobalHeaderSearch from '@/Components/Dashboard/GlobalHeaderSearch';
import { safeHref } from './utils';

export default function Header({ user, sidebarOpen, setSidebarOpen, header }) {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={() => setSidebarOpen((open) => !open)}
                    className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <GlobalHeaderSearch />

                <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden text-sm text-slate-500 lg:block">
                        {user?.name}
                    </span>
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button
                                type="button"
                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                                <span className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-semibold">
                                    {(user?.name || 'U').charAt(0)}
                                </span>
                                <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="48">
                            <Dropdown.Link href={safeHref(typeof route !== 'undefined' ? route('profile.edit') : null)}>Profile</Dropdown.Link>
                            <Dropdown.Link href={safeHref(typeof route !== 'undefined' ? route('logout') : null)} method="post" as="button">
                                Log Out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>
            {header && (
                <div className="border-t border-slate-100 px-4 py-3 sm:px-6 lg:px-8">
                    {header}
                </div>
            )}
        </header>
    );
}
