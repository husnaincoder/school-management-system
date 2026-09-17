import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClock,
    faDoorOpen,
    faCalendarCheck,
    faChalkboardTeacher,
    faPenToSquare,
    faEye,
    faCalendarDay,
    faPlus,
} from '@fortawesome/free-solid-svg-icons';

const MODULES = [
    {
        title: 'Time Slots',
        description: 'Define daily periods and breaks',
        routeName: 'academic.time-slots.index',
        icon: faClock,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Class Rooms',
        description: 'Manage classrooms and labs',
        routeName: 'academic.class-rooms.index',
        icon: faDoorOpen,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Timetables',
        description: 'Create and build class timetables',
        routeName: 'academic.timetables.index',
        icon: faCalendarCheck,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Teacher Availabilities',
        description: 'Weekly teacher availability for scheduling',
        routeName: 'academic.teacher-availabilities.index',
        icon: faChalkboardTeacher,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Timetable Adjustments',
        description: 'Substitutions and leave impacts',
        routeName: 'academic.timetable-adjustments.index',
        icon: faPenToSquare,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Class / Teacher / Room Views',
        description: 'Browse weekly schedules by class, teacher, or room',
        routeName: 'academic.timetable-views',
        icon: faEye,
        cardBg: 'bg-sky-50',
        iconBg: 'bg-sky-600',
    },
    {
        title: "Today's Timetable",
        description: 'Daily schedule with substitutions',
        routeName: 'academic.timetable-daily',
        icon: faCalendarDay,
        cardBg: 'bg-emerald-50',
        iconBg: 'bg-emerald-600',
    },
];

export default function TimeTableManagement({ stats = {} }) {
    const cards = [
        { label: 'Timetables', value: stats.total_timetables ?? 0 },
        { label: 'Active', value: stats.active_timetables ?? 0 },
        { label: 'Teachers', value: stats.total_teachers ?? 0 },
        { label: 'Rooms', value: stats.total_rooms ?? 0 },
        { label: 'Time Slots', value: stats.total_slots ?? 0 },
        { label: "Today's Classes", value: stats.todays_classes ?? 0 },
        { label: 'Substitutions', value: stats.todays_substitutions ?? 0 },
        { label: 'Conflicts', value: stats.conflicts ?? 0, warn: (stats.conflicts ?? 0) > 0 },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Time Table Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Dashboard / Time Table Management</p>
                            <h1 className="text-2xl font-bold text-gray-900">Time Table Management</h1>
                            <p className="text-sm text-gray-500 mt-1">Schedule classes, detect conflicts, and manage substitutions.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('academic.timetables.create')} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                <FontAwesomeIcon icon={faPlus} /> Create Timetable
                            </Link>
                            <Link href={route('academic.timetable-daily')} className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm">
                                Today&apos;s Timetable
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
                        {cards.map((c) => (
                            <div key={c.label} className={`rounded-xl border p-3 ${c.warn ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                                <p className="text-xs text-gray-500">{c.label}</p>
                                <p className={`text-xl font-bold mt-1 ${c.warn ? 'text-red-700' : 'text-gray-900'}`}>{c.value}{c.warn ? ' ⚠' : ''}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {MODULES.map((mod) => (
                            <Link
                                key={mod.routeName}
                                href={route(mod.routeName)}
                                className={`group flex items-center gap-4 rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:shadow-md hover:border-amber-300 ${mod.cardBg}`}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white ${mod.iconBg}`}>
                                    <FontAwesomeIcon icon={mod.icon} className="text-lg" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base font-semibold text-gray-900">{mod.title}</h2>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mod.description}</p>
                                </div>
                                <span className="shrink-0 text-sm font-medium text-amber-600 group-hover:text-amber-700">Open →</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
