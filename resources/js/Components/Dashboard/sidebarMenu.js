import {
    faGauge,
    faUsers,
    faGraduationCap,
    faTableCells,
    faUserGraduate,
    faClipboardUser,
    faFilePen,
    faMoneyBillWave,
    faWallet,
    faReceipt,
    faBell,
    faCalendarDays,
    faCalendarXmark,
    faGear,
    faClipboardCheck,
    faChartLine,
    faFileInvoiceDollar,
    faPenToSquare,
    faFolderOpen,
    faListOl,
    faDollarSign,
    faHouse,
    faFileCircleCheck,
    faUserCheck,
} from '@fortawesome/free-solid-svg-icons';

/** Sidebar menu: { label, href, routeName, icon, roles } */
export const SIDEBAR_MENU = [
    {
        section: 'Main',
        roles: ['super_admin', 'admin', 'accountant', 'teacher', 'student', 'parent', 'employee'],
        items: [
            { label: 'Dashboard', href: '/dashboard/redirect', routeName: 'dashboard.redirect', icon: faGauge, roles: ['super_admin', 'admin', 'accountant', 'teacher', 'student', 'parent', 'employee'] },
        ],
    },
    {
        section: 'User Management',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'User Management', href: '/admin/user-management', routeName: 'admin.user-management', icon: faUsers, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Academic',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'Academic Session', href: '/admin/academic-session', routeName: 'admin.academic-session', icon: faGraduationCap, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Time Table',
        roles: ['super_admin', 'admin', 'teacher'],
        items: [
            { label: 'Time Table Management', href: '/admin/timetable-management', routeName: 'admin.timetable-management', icon: faTableCells, roles: ['super_admin', 'admin', 'teacher'] },
        ],
    },
    {
        section: 'Students',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'Students & Enrollments', href: '/admin/students-enrollments', routeName: 'admin.students-enrollments', icon: faUserGraduate, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Attendance',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'Attendance Management', href: '/admin/attendance-management', routeName: 'admin.attendance-management', icon: faClipboardUser, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Exam',
        roles: ['super_admin', 'admin', 'teacher'],
        items: [
            { label: 'Exam & Schedule', href: '/admin/exam-schedule', routeName: 'admin.exam-schedule', icon: faFilePen, roles: ['super_admin', 'admin', 'teacher'] },
        ],
    },
    {
        section: 'Accountant',
        roles: ['super_admin', 'admin', 'accountant'],
        items: [
            { label: 'Accountant Management', href: '/admin/accountant-management', routeName: 'admin.accountant-management', icon: faMoneyBillWave, roles: ['super_admin', 'admin', 'accountant'] },
        ],
    },
    {
        section: 'Payroll',
        roles: ['super_admin', 'admin', 'accountant'],
        items: [
            { label: 'Payroll Management', href: '/admin/payroll-management', routeName: 'admin.payroll-management', icon: faWallet, roles: ['super_admin', 'admin', 'accountant'] },
        ],
    },
    {
        section: 'Expense',
        roles: ['super_admin', 'admin', 'accountant'],
        items: [
            { label: 'Expense Management', href: '/admin/expense-management', routeName: 'admin.expense-management', icon: faReceipt, roles: ['super_admin', 'admin', 'accountant'] },
        ],
    },
    {
        section: 'Notice',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'Notice Management', href: '/admin/notice-management', routeName: 'admin.notice-management', icon: faBell, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Leave',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'Leave Management', href: '/admin/leave-management', routeName: 'admin.leave-management', icon: faCalendarDays, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Settings',
        roles: ['super_admin', 'admin'],
        items: [
            { label: 'Settings', href: '/admin/settings-management', routeName: 'admin.settings-management', icon: faGear, roles: ['super_admin', 'admin'] },
        ],
    },
    {
        section: 'Class Incharge',
        roles: ['class_incharge'],
        items: [
            { label: 'My Class', href: '/class-incharge', routeName: 'class-incharge.dashboard', icon: faHouse, roles: ['class_incharge'] },
            { label: 'My Students', href: '/teacher/students', routeName: 'teacher.students', icon: faUserGraduate, roles: ['class_incharge'] },
            { label: 'Attendance', href: '/teacher/attendance/sessions', routeName: 'teacher.attendance.sessions', icon: faClipboardCheck, roles: ['class_incharge'] },
            { label: 'Attendance Reports', href: '/attendance/reports', routeName: 'attendance.reports.index', icon: faChartLine, roles: ['class_incharge'] },
            { label: 'Student Remarks', href: '/teacher/remarks', routeName: 'teacher.remarks.index', icon: faPenToSquare, roles: ['class_incharge'] },
            { label: 'Announcements', href: '/class-incharge/notices', routeName: 'class-incharge.notices.index', icon: faBell, roles: ['class_incharge'] },
            { label: 'Class Activities', href: '/class-incharge/activities', routeName: 'class-incharge.activities.index', icon: faCalendarDays, roles: ['class_incharge'] },
            { label: 'Promotion Recs', href: '/class-incharge/promotion-recommendations', routeName: 'class-incharge.promotion-recommendations.index', icon: faGraduationCap, roles: ['class_incharge'] },
            { label: 'Parents', href: '/class-incharge/parents', routeName: 'class-incharge.parents.index', icon: faUsers, roles: ['class_incharge'] },
            { label: 'Leave Applications', href: '/teacher/leave-applications', routeName: 'teacher.leave-applications.index', icon: faFileCircleCheck, roles: ['class_incharge'] },
        ],
    },
    {
        section: 'Teacher',
        roles: ['teacher', 'class_incharge'],
        items: [
            { label: 'My Students', href: '/teacher/students', routeName: 'teacher.students', icon: faUserGraduate, roles: ['teacher'] },
            { label: 'Attendance', href: '/teacher/attendance', routeName: 'teacher.attendance', icon: faClipboardCheck, roles: ['teacher'] },
            { label: 'Attendance Reports', href: '/attendance/reports', routeName: 'attendance.reports.index', icon: faChartLine, roles: ['teacher'] },
            { label: 'Leave Applications', href: '/teacher/leave-applications', routeName: 'teacher.leave-applications.index', icon: faFileCircleCheck, roles: ['teacher'] },
            { label: 'My Leave', href: '/teacher/my-leaves', routeName: 'teacher.my-leaves.index', icon: faCalendarXmark, roles: ['teacher', 'class_incharge'] },
            { label: 'My Salary', href: '/teacher/salary', routeName: 'teacher.salary', icon: faWallet, roles: ['teacher', 'class_incharge'] },
            { label: 'My Salary Slips', href: '/teacher/salary-slips', routeName: 'teacher.salary-slips', icon: faFileInvoiceDollar, roles: ['teacher', 'class_incharge'] },
            { label: 'Student Remarks', href: '/teacher/remarks', routeName: 'teacher.remarks.index', icon: faPenToSquare, roles: ['teacher'] },
            { label: 'Materials', href: '/academic/materials', routeName: 'academic.materials', icon: faFolderOpen, roles: ['teacher', 'class_incharge'] },
            { label: 'Marks', href: '/teacher/marks', routeName: 'teacher.marks', icon: faListOl, roles: ['teacher', 'class_incharge'] },
        ],
    },
    {
        section: 'Student',
        roles: ['student'],
        items: [
            { label: 'My Attendance', href: '/student/attendance', routeName: 'student.attendance', icon: faUserCheck, roles: ['student'] },
            { label: 'My Marks', href: '/student/marks', routeName: 'student.marks', icon: faListOl, roles: ['student'] },
            { label: 'My Fees', href: '/student/fees', routeName: 'student.fees', icon: faDollarSign, roles: ['student'] },
            { label: 'Materials', href: '/academic/materials', routeName: 'academic.materials', icon: faFolderOpen, roles: ['student'] },
        ],
    },
    {
        section: 'Employee',
        roles: ['employee'],
        items: [
            { label: 'My Attendance', href: '/employee/attendance', routeName: 'employee.attendance', icon: faUserCheck, roles: ['employee'] },
            { label: 'My Salary', href: '/employee/salary', routeName: 'employee.salary', icon: faWallet, roles: ['employee'] },
            { label: 'My Salary Slips', href: '/employee/salary-slips', routeName: 'employee.salary-slips', icon: faFileInvoiceDollar, roles: ['employee'] },
            { label: 'My Leave', href: '/employee/my-leaves', routeName: 'employee.my-leaves.index', icon: faCalendarXmark, roles: ['employee'] },
        ],
    },
    {
        section: 'Parent',
        roles: ['parent'],
        items: [
            { label: 'Dashboard', href: '/parent/dashboard', routeName: 'dashboard.parent', icon: faHouse, roles: ['parent'] },
            { label: "My Children's Fee", href: '/parent/fee', routeName: 'parent.fee', icon: faDollarSign, roles: ['parent'] },
            { label: 'Leave Applications', href: '/parent/leave-applications', routeName: 'parent.leave-applications.index', icon: faCalendarXmark, roles: ['parent'], forceReload: true },
            { label: 'Materials', href: '/academic/materials', routeName: 'academic.materials', icon: faFolderOpen, roles: ['parent'] },
        ],
    },
];
