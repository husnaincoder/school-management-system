import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBookOpen,
    faChalkboardTeacher,
    faEye,
    faFileInvoice,
    faMagnifyingGlass,
    faMoneyBillWave,
    faSpinner,
    faUserGraduate,
    faUserTie,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';

function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}

function sid(value) {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
}

function getXsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function money(value) {
    const n = Number(value || 0);
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function DetailRow({ label, value }) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <div className="flex gap-2 border-b border-slate-100 py-1.5 last:border-b-0">
            <dt className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="min-w-0 flex-1 break-words text-sm text-slate-800">{value}</dd>
        </div>
    );
}

const TYPE_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pages', label: 'Pages' },
    { key: 'students', label: 'Students' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'employees', label: 'Employees' },
];

const TYPE_ICON = {
    page: faBookOpen,
    student: faUserGraduate,
    teacher: faChalkboardTeacher,
    employee: faUserTie,
};

const TYPE_COLOR = {
    page: 'bg-sky-50 text-sky-700',
    student: 'bg-amber-50 text-amber-700',
    teacher: 'bg-violet-50 text-violet-700',
    employee: 'bg-emerald-50 text-emerald-700',
};

const FEE_STATUS_STYLE = {
    paid: 'bg-emerald-100 text-emerald-800',
    unpaid: 'bg-rose-100 text-rose-800',
    partial: 'bg-amber-100 text-amber-800',
    no_invoice: 'bg-slate-100 text-slate-600',
};

const TYPE_LABEL = {
    student: 'Student Details',
    teacher: 'Teacher Details',
    employee: 'Employee Details',
};

function ModalShell({ children, onClose, maxWidth = 'max-w-lg' }) {
    return createPortal(
        <div
            className="fixed inset-0 z-[10000] overflow-y-auto bg-black/45"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose?.();
            }}
        >
            <div className="flex min-h-full items-start justify-center px-4 pb-10 pt-20 sm:pt-24">
                <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl`}>{children}</div>
            </div>
        </div>,
        document.body
    );
}

export default function GlobalHeaderSearch() {
    const rootRef = useRef(null);
    const inputWrapRef = useRef(null);
    const panelRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [type, setType] = useState('all');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ pages: [], students: [], teachers: [], employees: [] });
    const [canPeople, setCanPeople] = useState(false);
    const [canStudents, setCanStudents] = useState(false);
    const [canCollect, setCanCollect] = useState(false);
    const [filterTree, setFilterTree] = useState([]);
    const [sessionId, setSessionId] = useState('');
    const [classId, setClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [feeStatus, setFeeStatus] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [metaLoaded, setMetaLoaded] = useState(false);
    const [panelStyle, setPanelStyle] = useState(null);
    const [detailTarget, setDetailTarget] = useState(null);
    const [collectTarget, setCollectTarget] = useState(null);
    const [collectForm, setCollectForm] = useState({
        amount: '',
        method: 'cash',
        payment_date: new Date().toISOString().slice(0, 10),
        transaction_id: '',
    });
    const [collectError, setCollectError] = useState('');
    const [collecting, setCollecting] = useState(false);
    const [toast, setToast] = useState('');

    const selectedSession = useMemo(
        () => asArray(filterTree).find((row) => sid(row.id) === sessionId) || null,
        [filterTree, sessionId]
    );
    const classOptions = useMemo(() => asArray(selectedSession?.classes), [selectedSession]);
    const selectedClass = useMemo(
        () => classOptions.find((row) => sid(row.id) === classId) || null,
        [classOptions, classId]
    );
    const sectionOptions = useMemo(() => asArray(selectedClass?.sections), [selectedClass]);

    const visibleTabs = useMemo(() => {
        return TYPE_TABS.filter((tab) => {
            if (tab.key === 'all' || tab.key === 'pages') return true;
            if (tab.key === 'students') return canStudents;
            return canPeople;
        });
    }, [canPeople, canStudents]);

    const flatResults = useMemo(() => {
        const groups = [
            { key: 'pages', label: 'Pages', items: results.pages || [] },
            { key: 'students', label: 'Students', items: results.students || [] },
            { key: 'teachers', label: 'Teachers', items: results.teachers || [] },
            { key: 'employees', label: 'Employees', items: results.employees || [] },
        ];
        return groups.filter((g) => g.items.length > 0);
    }, [results]);

    const totalCount = flatResults.reduce((sum, g) => sum + g.items.length, 0);
    const modalOpen = Boolean(detailTarget || collectTarget);
    const showStudentFilters = canStudents && (type === 'all' || type === 'students');

    const updatePanelPosition = useCallback(() => {
        const el = inputWrapRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const width = Math.min(Math.max(rect.width, 360), Math.min(640, window.innerWidth - 24));
        const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
        const top = rect.bottom + 8;
        const maxHeight = Math.max(220, window.innerHeight - top - 16);

        setPanelStyle({
            position: 'fixed',
            top,
            left,
            width,
            maxHeight,
            zIndex: 9990,
        });
    }, []);

    useLayoutEffect(() => {
        if (!open || modalOpen) return undefined;
        updatePanelPosition();
        const onReposition = () => updatePanelPosition();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, modalOpen, updatePanelPosition, flatResults.length, showStudentFilters]);

    useEffect(() => {
        const onDocClick = (event) => {
            if (modalOpen) return;
            const inRoot = rootRef.current?.contains(event.target);
            const inPanel = panelRef.current?.contains(event.target);
            if (!inRoot && !inPanel) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [modalOpen]);

    useEffect(() => {
        if (!open || metaLoaded) return;
        fetch(route('global-search.meta'), {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        })
            .then((r) => r.json())
            .then((data) => {
                setCanPeople(Boolean(data.can_search_people));
                setCanStudents(Boolean(data.can_search_students ?? data.can_search_people));
                setCanCollect(Boolean(data.can_collect_fee));
                setFilterTree(asArray(data.filter_tree));
                setMetaLoaded(true);
            })
            .catch(() => setMetaLoaded(true));
    }, [open, metaLoaded]);

    const runSearch = useCallback((signal) => {
        const q = query.trim();
        const studentScoped = type === 'students' && (sessionId || classId || sectionId || feeStatus || paymentMethod);
        if (q.length < 1 && !studentScoped) {
            setResults({ pages: [], students: [], teachers: [], employees: [] });
            setLoading(false);
            return;
        }

        setLoading(true);
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        params.set('type', type);
        if (sessionId) params.set('academic_session_id', sessionId);
        if (classId) params.set('class_id', classId);
        if (sectionId) params.set('section_id', sectionId);
        if (feeStatus) params.set('fee_status', feeStatus);
        if (paymentMethod) params.set('payment_method', paymentMethod);

        fetch(`${route('global-search')}?${params.toString()}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
            signal,
        })
            .then((r) => r.json())
            .then((data) => {
                setResults(data.results || { pages: [], students: [], teachers: [], employees: [] });
                setLoading(false);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') setLoading(false);
            });
    }, [query, type, sessionId, classId, sectionId, feeStatus, paymentMethod]);

    useEffect(() => {
        if (!open || modalOpen) return undefined;
        const controller = new AbortController();
        const timer = setTimeout(() => runSearch(controller.signal), 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [open, modalOpen, runSearch]);

    const visitUrl = (url) => {
        if (!url) return;
        setDetailTarget(null);
        setCollectTarget(null);
        setOpen(false);
        setQuery('');
        router.visit(url);
    };

    const openResult = (item) => {
        if (!item) return;
        if (item.type === 'page') {
            visitUrl(item.url);
            return;
        }
        setOpen(false);
        setDetailTarget(item);
    };

    const openCollect = (item, event) => {
        event?.stopPropagation();
        event?.preventDefault();
        const fee = item?.fee;
        if (!fee?.can_collect || !fee?.invoice_id) return;
        setOpen(false);
        setDetailTarget(null);
        setCollectTarget(item);
        setCollectError('');
        setCollectForm({
            amount: String(fee.collect_balance ?? fee.balance ?? ''),
            method: paymentMethod || 'cash',
            payment_date: new Date().toISOString().slice(0, 10),
            transaction_id: '',
        });
    };

    const submitCollect = async (event) => {
        event.preventDefault();
        if (!collectTarget?.fee?.invoice_id) return;
        setCollecting(true);
        setCollectError('');
        try {
            await axios.post(
                route('invoice-payments.store', collectTarget.fee.invoice_id),
                {
                    amount: Number(collectForm.amount),
                    method: collectForm.method,
                    payment_date: collectForm.payment_date,
                    transaction_id: collectForm.transaction_id || null,
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                }
            );
            setToast(`Payment collected for ${collectTarget.title}`);
            setCollectTarget(null);
            setOpen(true);
            runSearch();
            setTimeout(() => setToast(''), 2500);
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                error.response?.data?.errors?.amount?.[0] ||
                error.response?.data?.errors?.method?.[0] ||
                'Could not record payment.';
            setCollectError(msg);
        } finally {
            setCollecting(false);
        }
    };

    const detailMeta = detailTarget?.meta || {};

    const searchPanel = open && !modalOpen && panelStyle
        ? createPortal(
            <div
                ref={panelRef}
                style={panelStyle}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
                    {visibleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setType(tab.key)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                type === tab.key
                                    ? 'bg-amber-500 text-white'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {showStudentFilters && (
                    <div className="shrink-0 space-y-2 border-b border-slate-100 bg-white px-3 py-2.5">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <select
                                value={sessionId}
                                onChange={(e) => {
                                    setSessionId(e.target.value);
                                    setClassId('');
                                    setSectionId('');
                                    setType('students');
                                }}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                            >
                                <option value="">Session</option>
                                {asArray(filterTree).map((s) => (
                                    <option key={s.id} value={sid(s.id)}>{s.name}</option>
                                ))}
                            </select>
                            <select
                                value={classId}
                                onChange={(e) => {
                                    setClassId(e.target.value);
                                    setSectionId('');
                                    setType('students');
                                }}
                                disabled={!sessionId}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 disabled:opacity-50"
                            >
                                <option value="">Class</option>
                                {classOptions.map((c) => (
                                    <option key={c.id} value={sid(c.id)}>{c.name}</option>
                                ))}
                            </select>
                            <select
                                value={sectionId}
                                onChange={(e) => {
                                    setSectionId(e.target.value);
                                    setType('students');
                                }}
                                disabled={!classId}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 disabled:opacity-50"
                            >
                                <option value="">Section</option>
                                {sectionOptions.map((s) => (
                                    <option key={s.id} value={sid(s.id)}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <select
                                value={feeStatus}
                                onChange={(e) => {
                                    setFeeStatus(e.target.value);
                                    setType('students');
                                }}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                            >
                                <option value="">Fee status</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="no_invoice">No invoice</option>
                            </select>
                            <select
                                value={paymentMethod}
                                onChange={(e) => {
                                    setPaymentMethod(e.target.value);
                                    setType('students');
                                }}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                            >
                                <option value="">Pay method</option>
                                <option value="cash">Cash</option>
                                <option value="bank">Bank</option>
                                <option value="card">Card</option>
                                <option value="online">Online</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Searching...
                        </div>
                    ) : totalCount === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                            {query.trim() || sessionId || classId || sectionId || feeStatus || paymentMethod
                                ? 'No matches found. Try name, phone, roll, or staff ID.'
                                : 'Type a name — then open Details for student, teacher, or employee.'}
                        </div>
                    ) : (
                        flatResults.map((group) => (
                            <div key={group.key} className="border-b border-slate-100 last:border-b-0">
                                <div className="bg-slate-50/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {group.label}
                                    {group.key === 'students' && results.billing_month ? (
                                        <span className="ml-2 font-medium normal-case text-slate-400">
                                            · {results.billing_month}
                                        </span>
                                    ) : null}
                                </div>
                                <ul>
                                    {group.items.map((item) => (
                                        <li key={`${item.type}-${item.id}-${item.enrollment_id || ''}`}>
                                            <div className="flex w-full items-start gap-3 px-3 py-2.5 transition-colors hover:bg-amber-50/70">
                                                <button
                                                    type="button"
                                                    onClick={() => openResult(item)}
                                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                                >
                                                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TYPE_COLOR[item.type] || 'bg-slate-100 text-slate-600'}`}>
                                                        <FontAwesomeIcon icon={TYPE_ICON[item.type] || faMagnifyingGlass} className="text-xs" />
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openResult(item)}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <span className="block truncate text-sm font-semibold text-slate-900">{item.title}</span>
                                                    <span className="mt-0.5 block truncate text-xs text-slate-500">{item.subtitle}</span>
                                                    {item.type === 'student' && item.fee && (
                                                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${FEE_STATUS_STYLE[item.fee.status] || FEE_STATUS_STYLE.no_invoice}`}>
                                                                {item.fee.status_label}
                                                            </span>
                                                            {item.fee.status !== 'no_invoice' && (
                                                                <span className="text-[11px] text-slate-500">
                                                                    Total {money(item.fee.total_amount)} · Paid {money(item.fee.paid_amount)} · Due {money(item.fee.balance)}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                    {(item.type === 'teacher' || item.type === 'employee') && item.meta && (
                                                        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                                                            {item.meta.email && <span>{item.meta.email}</span>}
                                                            {item.meta.phone && <span>{item.meta.phone}</span>}
                                                            {item.meta.status && <span>Status: {item.meta.status}</span>}
                                                        </span>
                                                    )}
                                                </button>
                                                <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                                                    {item.type === 'student' && canCollect && item.fee?.can_collect && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => openCollect(item, e)}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-emerald-700"
                                                        >
                                                            <FontAwesomeIcon icon={faMoneyBillWave} />
                                                            Collect
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => openResult(item)}
                                                        className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600"
                                                    >
                                                        <FontAwesomeIcon icon={item.type === 'page' ? faBookOpen : faEye} />
                                                        {item.type === 'page' ? 'Open' : 'Details'}
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    )}
                </div>
                <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400">
                    Click Details for full info. Collect updates fee status.
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <div ref={rootRef} className="relative mx-3 min-w-0 flex-1 max-w-2xl">
            <div ref={inputWrapRef} className="relative">
                <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={
                        canPeople
                            ? 'Search student / teacher / employee details…'
                            : canStudents
                                ? 'Search student name, roll, fee, cash…'
                                : 'Search pages…'
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                />
                {(query || open) && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setOpen(false);
                            setResults({ pages: [], students: [], teachers: [], employees: [] });
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Clear search"
                    >
                        <FontAwesomeIcon icon={faXmark} className="text-sm" />
                    </button>
                )}
            </div>

            {toast && createPortal(
                <div className="fixed left-1/2 top-20 z-[10001] -translate-x-1/2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
                    {toast}
                </div>,
                document.body
            )}

            {searchPanel}

            {detailTarget && (
                <ModalShell onClose={() => setDetailTarget(null)} maxWidth="max-w-lg">
                    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3">
                            <div className="min-w-0">
                                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                                    {TYPE_LABEL[detailTarget.type] || 'Details'}
                                </div>
                                <h3 className="truncate text-base font-bold text-slate-900">{detailTarget.title}</h3>
                                <p className="mt-0.5 text-xs text-slate-500">{detailTarget.subtitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailTarget(null)}
                                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </button>
                        </div>

                        <div className="px-4 py-3">
                            {detailTarget.type === 'student' && (
                                <>
                                    <dl>
                                        <DetailRow label="Admission" value={detailMeta.admission_number} />
                                        <DetailRow label="Roll" value={detailMeta.roll_number} />
                                        <DetailRow label="Session" value={detailMeta.session} />
                                        <DetailRow label="Class" value={detailMeta.class} />
                                        <DetailRow label="Section" value={detailMeta.section} />
                                        <DetailRow label="Gender" value={detailMeta.gender} />
                                        <DetailRow label="DOB" value={detailMeta.date_of_birth} />
                                        <DetailRow label="CNIC" value={detailMeta.cnic} />
                                        <DetailRow label="Phone" value={detailMeta.phone} />
                                        <DetailRow label="Email" value={detailMeta.email} />
                                        <DetailRow label="Address" value={detailMeta.address} />
                                        <DetailRow label="Parent" value={detailMeta.parent_name} />
                                        <DetailRow label="Parent phone" value={detailMeta.parent_phone} />
                                        <DetailRow label="Relation" value={detailMeta.parent_relation} />
                                        <DetailRow label="Occupation" value={detailMeta.parent_occupation} />
                                    </dl>
                                    {detailTarget.fee && (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                Current month fee
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${FEE_STATUS_STYLE[detailTarget.fee.status] || FEE_STATUS_STYLE.no_invoice}`}>
                                                    {detailTarget.fee.status_label}
                                                </span>
                                                {detailTarget.fee.status !== 'no_invoice' && (
                                                    <span className="text-xs text-slate-600">
                                                        Total {money(detailTarget.fee.total_amount)} · Paid {money(detailTarget.fee.paid_amount)} · Due {money(detailTarget.fee.balance)}
                                                    </span>
                                                )}
                                            </div>
                                            {detailTarget.fee.invoice_no && (
                                                <div className="mt-1 text-[11px] text-slate-400">Invoice #{detailTarget.fee.invoice_no}</div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {detailTarget.type === 'teacher' && (
                                <dl>
                                    <DetailRow label="Staff ID" value={detailMeta.staff_id} />
                                    <DetailRow label="Designation" value={detailMeta.designation} />
                                    <DetailRow label="Department" value={detailMeta.department} />
                                    <DetailRow label="Specialization" value={detailMeta.specialization} />
                                    <DetailRow label="Experience" value={detailMeta.experience} />
                                    <DetailRow label="Joining" value={detailMeta.joining_date} />
                                    <DetailRow label="Status" value={detailMeta.status} />
                                    <DetailRow label="Phone" value={detailMeta.phone} />
                                    <DetailRow label="Email" value={detailMeta.email} />
                                    <DetailRow label="Address" value={detailMeta.address} />
                                    <DetailRow label="Emergency" value={detailMeta.emergency_contact} />
                                    <DetailRow label="Emerg. phone" value={detailMeta.emergency_phone} />
                                </dl>
                            )}

                            {detailTarget.type === 'employee' && (
                                <dl>
                                    <DetailRow label="Employee ID" value={detailMeta.employee_id} />
                                    <DetailRow label="Designation" value={detailMeta.designation} />
                                    <DetailRow label="Department" value={detailMeta.department} />
                                    <DetailRow label="Qualification" value={detailMeta.qualification} />
                                    <DetailRow label="Experience" value={detailMeta.experience} />
                                    <DetailRow label="Joining" value={detailMeta.joining_date} />
                                    <DetailRow label="Status" value={detailMeta.status} />
                                    <DetailRow label="Phone" value={detailMeta.phone} />
                                    <DetailRow label="Email" value={detailMeta.email} />
                                    <DetailRow label="Address" value={detailMeta.address} />
                                    <DetailRow label="Emergency" value={detailMeta.emergency_contact} />
                                    <DetailRow label="Emerg. phone" value={detailMeta.emergency_phone} />
                                </dl>
                            )}
                        </div>

                        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3">
                            <button
                                type="button"
                                onClick={() => setDetailTarget(null)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                            >
                                Close
                            </button>
                            {detailTarget.type === 'student' && canCollect && detailTarget.fee?.can_collect && (
                                <button
                                    type="button"
                                    onClick={(e) => openCollect(detailTarget, e)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                    <FontAwesomeIcon icon={faMoneyBillWave} />
                                    Collect Fee
                                </button>
                            )}
                            {detailTarget.invoice_url && (
                                <button
                                    type="button"
                                    onClick={() => visitUrl(detailTarget.invoice_url)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800"
                                >
                                    <FontAwesomeIcon icon={faFileInvoice} />
                                    Open Invoice
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => visitUrl(detailTarget.profile_url || detailTarget.url)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
                            >
                                <FontAwesomeIcon icon={faEye} />
                                Full Profile
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}

            {collectTarget && (
                <ModalShell onClose={() => setCollectTarget(null)} maxWidth="max-w-md">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Collect Fee</h3>
                            <p className="mt-0.5 text-xs text-slate-500">{collectTarget.title}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCollectTarget(null)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                        >
                            <FontAwesomeIcon icon={faXmark} />
                        </button>
                    </div>
                    <form onSubmit={submitCollect} className="space-y-3 px-4 py-4">
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            <div>Due: <strong>{money(collectTarget.fee?.collect_balance ?? collectTarget.fee?.balance)}</strong></div>
                            <div className="mt-0.5">Invoice: #{collectTarget.fee?.invoice_no || collectTarget.fee?.invoice_id}</div>
                            <div className="mt-0.5">{collectTarget.fee?.billing_month_label}</div>
                        </div>
                        <label className="block text-xs font-semibold text-slate-600">
                            Amount
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                value={collectForm.amount}
                                onChange={(e) => setCollectForm((f) => ({ ...f, amount: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block text-xs font-semibold text-slate-600">
                            Method
                            <select
                                value={collectForm.method}
                                onChange={(e) => setCollectForm((f) => ({ ...f, method: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                                <option value="cash">Cash</option>
                                <option value="bank">Bank</option>
                                <option value="card">Card</option>
                                <option value="online">Online</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </label>
                        <label className="block text-xs font-semibold text-slate-600">
                            Payment date
                            <input
                                type="date"
                                required
                                value={collectForm.payment_date}
                                onChange={(e) => setCollectForm((f) => ({ ...f, payment_date: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block text-xs font-semibold text-slate-600">
                            Transaction ID (optional)
                            <input
                                type="text"
                                value={collectForm.transaction_id}
                                onChange={(e) => setCollectForm((f) => ({ ...f, transaction_id: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                        </label>
                        {collectError && (
                            <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{collectError}</div>
                        )}
                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setCollectTarget(null)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={collecting}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {collecting ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faMoneyBillWave} />}
                                Collect Payment
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}
        </div>
    );
}
