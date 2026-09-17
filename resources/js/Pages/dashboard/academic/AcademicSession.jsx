import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faSchool,
    faLayerGroup,
    faLink,
    faBook,
    faUser,
    faFile,
} from '@fortawesome/free-solid-svg-icons';

const MODULES = [
    {
        title: 'Sessions',
        description: 'Manage academic sessions and years',
        routeName: 'academic.sessions',
        icon: faCalendarAlt,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Classes',
        description: 'Manage school classes and grades',
        routeName: 'academic.classes',
        icon: faSchool,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Sections',
        description: 'Manage class sections',
        routeName: 'academic.sections',
        icon: faLayerGroup,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Class Sections',
        description: 'Link classes with sections',
        routeName: 'academic.class-sections',
        icon: faLink,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Subject Groups',
        description: 'Manage subject groups',
        routeName: 'academic.subject-groups',
        icon: faBook,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Class Section Groups',
        description: 'Assign groups to class sections',
        routeName: 'academic.class-section-groups',
        icon: faLayerGroup,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Class Section Group Subjects',
        description: 'Subjects per class section group',
        routeName: 'academic.class-section-group-subjects',
        icon: faBook,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Class Incharges',
        description: 'Assign class incharge teachers',
        routeName: 'academic.class-incharges',
        icon: faUser,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Subjects',
        description: 'Manage subjects and curriculum',
        routeName: 'academic.subjects',
        icon: faBook,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Materials',
        description: 'Upload and manage study materials',
        routeName: 'academic.materials',
        icon: faFile,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
];

export default function AcademicSession() {
    return (
        <AuthenticatedLayout>
            <Head title="Academic Session" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-1">Dashboard / Academic Session</p>
                        <h1 className="text-2xl font-bold text-gray-900">Academic Session</h1>
                        <p className="text-sm text-gray-500 mt-1">Quick access to all academic session modules.</p>
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
                                <span className="shrink-0 text-sm font-medium text-amber-600 group-hover:text-amber-700">
                                    Open →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
