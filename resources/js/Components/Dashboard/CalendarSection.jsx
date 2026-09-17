import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function shiftMonth(monthKey, delta) {
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthCells(monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0).getDate();
    const leading = first.getDay();
    const cells = [];

    for (let i = 0; i < leading; i++) cells.push(null);
    for (let day = 1; day <= lastDay; day++) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
}

function toDateKey(monthKey, day) {
    const [y, m] = monthKey.split('-');
    return `${y}-${m}-${String(day).padStart(2, '0')}`;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

export default function CalendarSection({
    calendar = {},
    calendarMonth = '',
    weekOffset = 0,
}) {
    const monthKey = calendar.month || calendarMonth || new Date().toISOString().slice(0, 7);
    const monthLabel = calendar.monthLabel || monthKey;
    const eventsByDate = calendar.eventsByDate || {};

    const [currentView, setCurrentView] = useState('Month');
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const [y, m] = monthKey.split('-').map(Number);
        if (today.getFullYear() === y && today.getMonth() + 1 === m) {
            return today;
        }
        return new Date(y, m - 1, 1);
    });

    const cells = useMemo(() => buildMonthCells(monthKey), [monthKey]);
    const today = new Date();

    const navigateMonth = (delta) => {
        const next = shiftMonth(monthKey, delta);
        router.get(route('dashboard.superadmin'), {
            week_offset: weekOffset,
            calendar_month: next,
        }, { preserveState: true, preserveScroll: true });
    };

    const selectedKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const selectedEvents = eventsByDate[selectedKey] || [];

    const weekEvents = useMemo(() => {
        if (currentView !== 'Week') return [];
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - start.getDay());
        const items = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            (eventsByDate[key] || []).forEach((ev) => items.push({ ...ev, dateKey: key }));
        }
        return items;
    }, [currentView, selectedDate, eventsByDate]);

    const monthEventCount = Object.values(eventsByDate).reduce((sum, list) => sum + list.length, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Event Calendar</h3>
                <span className="text-xs text-slate-400">{monthEventCount} event{monthEventCount !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigateMonth(-1)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        aria-label="Previous month"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 min-w-[120px] text-center">{monthLabel}</span>
                    <button
                        type="button"
                        onClick={() => navigateMonth(1)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                        aria-label="Next month"
                    >
                        <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                    </button>
                </div>
                <button type="button" className="text-slate-400 hover:text-slate-600 p-1" aria-hidden>
                    <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 mb-4">
                {['Day', 'Week', 'Month'].map((view) => (
                    <button
                        key={view}
                        type="button"
                        onClick={() => setCurrentView(view)}
                        className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                            currentView === view
                                ? 'bg-pink-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {view}
                    </button>
                ))}
            </div>

            {currentView === 'Month' && (
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                    <div className="grid grid-cols-7 bg-slate-50">
                        {DAYS_OF_WEEK.map((day) => (
                            <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2 border-r border-slate-200 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {cells.map((day, idx) => {
                            if (day === null) {
                                return <div key={`empty-${idx}`} className="aspect-square border-r border-b border-slate-200 bg-slate-50/50 last:border-r-0" />;
                            }
                            const dateKey = toDateKey(monthKey, day);
                            const dayEvents = eventsByDate[dateKey] || [];
                            const cellDate = new Date(dateKey);
                            const isToday = isSameDay(cellDate, today);
                            const isSelected = isSameDay(cellDate, selectedDate);

                            return (
                                <button
                                    key={dateKey}
                                    type="button"
                                    onClick={() => setSelectedDate(cellDate)}
                                    className="aspect-square border-r border-b border-slate-200 p-1 flex flex-col items-center justify-center hover:bg-slate-50 last:border-r-0 relative"
                                >
                                    <span
                                        className={`text-xs w-7 h-7 flex items-center justify-center rounded-full ${
                                            isSelected
                                                ? 'bg-pink-500 text-white font-semibold'
                                                : isToday
                                                    ? 'bg-pink-100 text-pink-700 font-semibold'
                                                    : 'text-slate-600'
                                        }`}
                                    >
                                        {day}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <span className="flex gap-0.5 mt-0.5">
                                            {dayEvents.slice(0, 3).map((ev) => (
                                                <span
                                                    key={ev.id}
                                                    className="w-1 h-1 rounded-full"
                                                    style={{ backgroundColor: ev.color || '#3b82f6' }}
                                                />
                                            ))}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {(currentView === 'Day' || currentView === 'Week' || currentView === 'Month') && (
                <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        {currentView === 'Day' && selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        {currentView === 'Week' && 'This week'}
                        {currentView === 'Month' && selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                        {(currentView === 'Week' ? weekEvents : selectedEvents).length === 0 ? (
                            <p className="text-sm text-slate-400 py-2">No events for this {currentView.toLowerCase()}.</p>
                        ) : (
                            (currentView === 'Week' ? weekEvents : selectedEvents).map((ev) => (
                                <div key={`${ev.id}-${ev.dateKey || selectedKey}`} className="flex items-start gap-2 text-sm">
                                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ev.color || '#3b82f6' }} />
                                    <div>
                                        <p className="text-slate-800 font-medium leading-snug">{ev.title}</p>
                                        <p className="text-xs text-slate-400 capitalize">{ev.type}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
