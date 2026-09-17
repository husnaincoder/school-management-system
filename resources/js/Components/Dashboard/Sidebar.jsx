import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { SIDEBAR_MENU } from './sidebarMenu';
import { safeHref, hasAnyRole } from './utils';

const headerOrange = '#FFA500';
const sidebarDark = '#2E3D50';
const activeItemBg = '#3C4D61';
const accentOrange = '#FFA500';

function isNavItemActive(item) {
    const current = typeof route !== 'undefined' ? route().current() : '';
    const baseRoute = item.routeName?.replace(/\.(index|show|create|edit)$/, '') ?? '';
    return item.routeName && (current === item.routeName || (baseRoute && current.startsWith(baseRoute)));
}

function findOpenSection(sections, userRoles) {
    const current = typeof route !== 'undefined' ? route().current() : '';
    for (const section of sections) {
        if (!section.collapsible) continue;
        const items = section.items.filter((item) => hasAnyRole(userRoles, item.roles));
        if (section.hubRouteName && current === section.hubRouteName) {
            return section.section;
        }
        if (items.some((item) => isNavItemActive(item))) {
            return section.section;
        }
    }
    return null;
}

function NavItem({ item, sidebarOpen, userRoles }) {
    let rawHref = item.href;
    if (rawHref == null || rawHref === '') {
        try {
            rawHref = (typeof route !== 'undefined' && item.routeName) ? route(item.routeName) : null;
        } catch (_) {
            rawHref = null;
        }
    }
    const href = (rawHref != null && rawHref !== '') ? String(rawHref) : '/dashboard/redirect';
    const isActive = isNavItemActive(item);
    return (
        <Link
            href={href}
            preserveState={!(item.forceReload === true)}
            className={`flex items-center border-l-4 py-2.5 text-sm font-medium transition-all duration-300 hover:opacity-90 ${sidebarOpen ? 'gap-3 pl-3 pr-4' : 'justify-center px-0'}`}
            style={{
                borderLeftColor: isActive ? accentOrange : 'transparent',
                backgroundColor: isActive ? activeItemBg : 'transparent',
                color: 'white',
            }}
            title={!sidebarOpen ? item.label : undefined}
        >
            <span className="text-base shrink-0 flex items-center justify-center w-6" style={{ color: accentOrange }}>
                {item.icon && typeof item.icon === 'object' ? (
                    <FontAwesomeIcon icon={item.icon} />
                ) : (
                    item.icon
                )}
            </span>
            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'w-0 opacity-0'}`}>{item.label}</span>
        </Link>
    );
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, user, userRoles }) {
    const { props } = usePage();
    const branding = props.branding ?? null;
    const visibleSections = SIDEBAR_MENU.filter((sec) => hasAnyRole(userRoles, sec.roles));
    const [openSection, setOpenSection] = useState(() => findOpenSection(visibleSections, userRoles));

    useEffect(() => {
        const activeSection = findOpenSection(visibleSections, userRoles);
        if (activeSection) {
            setOpenSection(activeSection);
        }
    }, [props.url, userRoles]);

    // Sidebar is dark/orange: prefer dark logo, then light/small
    const logoUrlExpanded = branding?.logo_dark_url ?? branding?.logo_light_url ?? branding?.logo_small_url;
    const logoUrlCollapsed = branding?.logo_small_url ?? branding?.logo_dark_url ?? branding?.logo_light_url;
    const logoUrl = sidebarOpen ? logoUrlExpanded : logoUrlCollapsed;
    const companyName = branding?.company_name?.trim() || 'School';

    const toggleSection = (sectionKey) => {
        setOpenSection((prev) => (prev === sectionKey ? null : sectionKey));
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-y-auto transition-[width] duration-300 ease-in-out ${
                sidebarOpen ? 'w-72' : 'w-20'
            }`}
            style={{ backgroundColor: sidebarDark }}
        >
            {/* Top: orange header - logo only */}
            <div
                className="flex h-28 shrink-0 items-center justify-center px-0 transition-all duration-300"
                style={{ backgroundColor: headerOrange }}
            >
                <Link
                    href={safeHref(typeof route !== 'undefined' ? route('dashboard.redirect') : null)}
                    className={`flex h-full w-full items-center justify-center overflow-hidden ${
                        sidebarOpen ? 'px-2' : 'px-1'
                    }`}
                    title={companyName}
                >
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={companyName}
                            className={`object-contain ${
                                sidebarOpen
                                    ? 'h-24 w-full max-w-none scale-110'
                                    : 'h-12 w-12'
                            }`}
                        />
                    ) : (
                        <span
                            className={`overflow-hidden whitespace-nowrap font-semibold text-white transition-all duration-300 ${
                                sidebarOpen ? 'opacity-100 w-auto text-base' : 'w-0 opacity-0'
                            }`}
                        >
                            {companyName}
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav: collapsed = icon only (centered), expanded = icon + label */}
            <nav className="flex-1 space-y-0 overflow-y-auto py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {visibleSections.map((section) => {
                    const filteredItems = section.items.filter((item) => hasAnyRole(userRoles, item.roles));
                    const isOpen = openSection === section.section;
                    const hasActiveChild = filteredItems.some((item) => isNavItemActive(item))
                        || (section.hubRouteName && (typeof route !== 'undefined' ? route().current() === section.hubRouteName : false));

                    if (section.collapsible) {
                        const sectionHubHref = section.hubRouteName
                            ? (typeof route !== 'undefined' ? route(section.hubRouteName) : section.items[0]?.href)
                            : null;

                        return (
                            <div key={section.section} className="mb-3 relative">
                                <p className={`mb-1.5 mt-2 overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${sidebarOpen ? 'px-4 opacity-100' : 'h-0 overflow-hidden px-0 opacity-0'}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
                                    {section.section}
                                </p>
                                <div
                                    className={`flex w-full items-center border-l-4 text-sm font-medium transition-all duration-300 ${sidebarOpen ? 'gap-0 pl-0 pr-1' : 'justify-center px-0'}`}
                                    style={{
                                        borderLeftColor: hasActiveChild ? accentOrange : 'transparent',
                                        backgroundColor: isOpen || hasActiveChild ? activeItemBg : 'transparent',
                                        color: 'white',
                                    }}
                                >
                                    {sectionHubHref ? (
                                        <Link
                                            href={sectionHubHref}
                                            onClick={() => setOpenSection(section.section)}
                                            className={`flex flex-1 items-center min-w-0 py-3 hover:opacity-90 transition-opacity ${sidebarOpen ? 'gap-3 pl-3 pr-2' : 'justify-center px-0'}`}
                                            title={!sidebarOpen ? section.sectionLabel || section.section : undefined}
                                        >
                                            <span className="text-base shrink-0 flex items-center justify-center w-6" style={{ color: accentOrange }}>
                                                <FontAwesomeIcon icon={section.sectionIcon || section.items[0]?.icon} />
                                            </span>
                                            <span className={`flex-1 text-left overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'w-0 opacity-0'}`}>
                                                {section.sectionLabel || section.section}
                                            </span>
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.section)}
                                            className={`flex flex-1 items-center min-w-0 py-3 hover:opacity-90 transition-opacity ${sidebarOpen ? 'gap-3 pl-3 pr-2' : 'justify-center px-0'}`}
                                            title={!sidebarOpen ? section.sectionLabel || section.section : undefined}
                                        >
                                            <span className="text-base shrink-0 flex items-center justify-center w-6" style={{ color: accentOrange }}>
                                                <FontAwesomeIcon icon={section.sectionIcon || section.items[0]?.icon} />
                                            </span>
                                            <span className={`flex-1 text-left overflow-hidden whitespace-nowrap transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'w-0 opacity-0'}`}>
                                                {section.sectionLabel || section.section}
                                            </span>
                                        </button>
                                    )}
                                    {sidebarOpen && (
                                        <button
                                            type="button"
                                            onClick={() => toggleSection(section.section)}
                                            className="shrink-0 rounded p-1.5 hover:bg-white/10 transition-colors"
                                            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
                                        >
                                            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.7)' }} />
                                        </button>
                                    )}
                                </div>
                                {isOpen && (
                                    <div className={sidebarOpen ? 'pl-2 border-l-2 ml-3 mt-0 border-white/10' : ''}>
                                        {filteredItems.map((item) => (
                                            <NavItem key={item.routeName || item.label} item={item} sidebarOpen={sidebarOpen} userRoles={userRoles} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <div key={section.section} className="mb-3">
                            <p className={`mb-1.5 overflow-hidden whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${sidebarOpen ? 'px-4 opacity-100' : 'h-0 overflow-hidden px-0 opacity-0'}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {section.section}
                            </p>
                            {filteredItems.map((item) => (
                                <NavItem key={item.routeName || item.label} item={item} sidebarOpen={sidebarOpen} userRoles={userRoles} />
                            ))}
                        </div>
                    );
                })}
            </nav>

            {/* User at bottom */}
            <div className={`shrink-0 border-t py-3 transition-all duration-300 ${sidebarOpen ? 'px-4' : 'px-2'}`} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm text-white"
                        style={{ backgroundColor: accentOrange }}
                    >
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                    <div className={`min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'w-0 opacity-0'}`}>
                        <p className="truncate text-sm font-medium text-white">{user?.name ?? 'Admin'}</p>
                        <p className="truncate text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{user?.email ?? 'admin@school.com'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
