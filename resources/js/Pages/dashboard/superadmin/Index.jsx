import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faChalkboardTeacher, faUserTie, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import IncomeExpensesCharts from '@/Components/Dashboard/IncomeExpensesCharts';
import CalendarSection from '@/Components/Dashboard/CalendarSection';
import NoticeBoard from '@/Components/Dashboard/NoticeBoard';
import RecentStudents from '@/Components/Dashboard/RecentStudents';

const STAT_CARDS = [
    { key: 'totalStudents', label: 'Students', bgColor: '#d4f4dd', iconColor: '#16a34a', icon: faUserGraduate },
    { key: 'totalTeachers', label: 'Teachers', bgColor: '#dbeafe', iconColor: '#2563eb', icon: faChalkboardTeacher },
    { key: 'totalStaff', label: 'Staff', bgColor: '#fef3c7', iconColor: '#d97706', icon: faUserTie },
    { key: 'totalParents', label: 'Parents', bgColor: '#e0e7ff', iconColor: '#6366f1', icon: faUserFriends },
];

export default function SuperAdminDashboard({
    stats = {},
    recentStudents = [],
    attendanceToday = null,
    charts = {},
    weekOffset = 0,
    calendar = {},
    calendarMonth = '',
    dashboardNotices = [],
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Super Admin Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Super Admin Dashboard</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Home</span>
                            <span className="text-slate-400">&gt;</span>
                            <span style={{ color: '#ffae01' }}>Super Admin</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {STAT_CARDS.map((card) => (
                            <div key={card.key} className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 flex items-center gap-6">
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: card.bgColor, color: card.iconColor }}
                                >
                                    <FontAwesomeIcon icon={card.icon} className="text-2xl" />
                                </div>
                                <div>
                                    <div className="text-gray-500 text-sm font-medium">{card.label}</div>
                                    <div className="text-2xl font-bold text-slate-800 mt-1">
                                        {stats[card.key] ?? 0}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <IncomeExpensesCharts charts={charts} weekOffset={weekOffset} calendarMonth={calendarMonth} />

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6 items-stretch">
                        <div className="md:col-span-12 lg:col-span-4 min-h-0">
                            <CalendarSection
                                calendar={calendar}
                                calendarMonth={calendarMonth}
                                weekOffset={weekOffset}
                            />
                        </div>
                        <div className="md:col-span-6 lg:col-span-4 min-h-0">
                            <NoticeBoard notices={dashboardNotices} />
                        </div>
                        <div className="md:col-span-6 lg:col-span-4 min-h-0">
                            <RecentStudents enrollments={recentStudents} />
                        </div>
                    </div>

                    {attendanceToday && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 border-l-4 border-sky-500">
                            <div className="p-6">
                                <h2 className="text-lg font-semibold mb-4">Today&apos;s Student Attendance</h2>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div>
                                        <div className="text-gray-500 text-xs">Total</div>
                                        <div className="text-xl font-bold">{attendanceToday.total}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs">Present</div>
                                        <div className="text-xl font-bold text-green-600">{attendanceToday.present}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs">Absent</div>
                                        <div className="text-xl font-bold text-red-600">{attendanceToday.absent}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs">Late</div>
                                        <div className="text-xl font-bold text-amber-600">{attendanceToday.late}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs">Leave</div>
                                        <div className="text-xl font-bold text-gray-600">{attendanceToday.leave}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs">Overall %</div>
                                        <div className={`text-xl font-bold ${attendanceToday.alert_below_75 ? 'text-red-600' : 'text-sky-600'}`}>
                                            {attendanceToday.percentage}%
                                        </div>
                                        {attendanceToday.alert_below_75 && (
                                            <div className="text-xs text-red-600 mt-0.5">Below 75%</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
