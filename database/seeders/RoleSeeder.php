<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User Management
            'user.view',
            'user.create',
            'user.edit',
            'user.delete',
            
            // Role Management
            'role.view',
            'role.create',
            'role.edit',
            'role.delete',
            
            // Academic
            'academic.session.view',
            'academic.session.create',
            'academic.session.edit',
            'academic.session.delete',
            'academic.class.view',
            'academic.class.create',
            'academic.class.edit',
            'academic.class.delete',
            'academic.section.view',
            'academic.section.create',
            'academic.section.edit',
            'academic.section.delete',
            'academic.subject.view',
            'academic.subject.create',
            'academic.subject.edit',
            'academic.subject.delete',
            'academic.exam.view',
            'academic.exam.create',
            'academic.exam.edit',
            'academic.exam.delete',
            'academic.attendance.view',
            'academic.attendance.create',
            'academic.marks.view',
            'academic.marks.create',
            
            // Student
            'student.view',
            'student.create',
            'student.edit',
            'student.delete',
            
            // HR
            'hr.employee.view',
            'hr.employee.create',
            'hr.employee.edit',
            'hr.employee.delete',
            'hr.salary.view',
            'hr.salary.create',
            'hr.leave.view',
            'hr.leave.approve',

            // Payroll
            'payroll.view',
            'payroll.generate',
            'payroll.approve',
            'payroll.pay',
            'salary_slip.view',
            'salary_slip.download',
            'salary_structure.manage',
            
            // Account
            'account.income.view',
            'account.income.create',
            'account.expense.view',
            'account.expense.create',
            'account.report.view',
            
            // Fee
            'fee.view',
            'fee.create',
            'fee.collect',
            'fee.report.view',
            'fee.invoice.view',
            'fee.invoice.create',
            'fee.invoice.edit',
            'fee.invoice.delete',
            'fee.payment.process',
            'fee.payment.void',
            'fee.discount.manage',
            'fee.fine.manage',
            'fee.auto_invoice.manage',
            'fee.own.view',
            'fee.own.children.view',

            // Transport
            'transport.view',
            'transport.create',
            'transport.edit',
            'transport.delete',
            
            // Hostel
            'hostel.view',
            'hostel.create',
            'hostel.edit',
            'hostel.delete',
            
            // Library
            'library.view',
            'library.create',
            'library.issue',

            // Class Incharge (data still scoped by class_incharges table)
            'class_incharge.view',
            'class_incharge.students.view',
            'class_incharge.attendance.mark',
            'class_incharge.attendance.report',
            'class_incharge.leave.approve',
            'class_incharge.fee.view',
            'class_incharge.notice.post',
            'class_incharge.remark.create',
            'class_incharge.exam.view',
            'class_incharge.marks.view',
            'class_incharge.result.view',
            'class_incharge.report.view',
            'class_incharge.activity.manage',
            'class_incharge.promotion.recommend',
            'class_incharge.parents.view',
            'class_incharge.timetable.view',
            'class_incharge.subjects.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo(Permission::all());

        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->givePermissionTo([
            'academic.session.view',
            'academic.session.create',
            'academic.class.view',
            'academic.class.create',
            'academic.class.edit',
            'academic.section.view',
            'academic.section.create',
            'academic.section.edit',
            'academic.subject.view',
            'academic.subject.create',
            'academic.subject.edit',
            'academic.exam.view',
            'academic.exam.create',
            'academic.attendance.view',
            'academic.attendance.create',
            'academic.marks.view',
            'academic.marks.create',
            'student.view',
            'student.create',
            'student.edit',
            'hr.employee.view',
            'hr.employee.create',
            'hr.employee.edit',
            'hr.salary.view',
            'hr.salary.create',
            'hr.leave.view',
            'hr.leave.approve',
            'payroll.view',
            'payroll.generate',
            'payroll.approve',
            'payroll.pay',
            'salary_slip.view',
            'salary_slip.download',
            'salary_structure.manage',
            'account.income.view',
            'account.expense.view',
            'fee.view',
            'fee.create',
            'fee.collect',
            'fee.report.view',
            'fee.invoice.view',
            'fee.invoice.create',
            'fee.invoice.edit',
            'fee.invoice.delete',
            'fee.payment.process',
            'fee.payment.void',
            'fee.discount.manage',
            'fee.fine.manage',
            'fee.auto_invoice.manage',
            'transport.view',
            'transport.create',
            'hostel.view',
            'hostel.create',
            'library.view',
            'library.create',
            'library.issue',
        ]);

        $accountant = Role::firstOrCreate(['name' => 'accountant', 'guard_name' => 'web']);
        $accountant->givePermissionTo([
            'account.income.view',
            'account.income.create',
            'account.expense.view',
            'account.expense.create',
            'account.report.view',
            'fee.view',
            'fee.create',
            'fee.collect',
            'fee.report.view',
            'fee.invoice.view',
            'fee.invoice.create',
            'fee.invoice.edit',
            'fee.invoice.delete',
            'fee.payment.process',
            'fee.payment.void',
            'fee.discount.manage',
            'fee.fine.manage',
            'payroll.view',
            'payroll.generate',
            'payroll.approve',
            'payroll.pay',
            'salary_slip.view',
            'salary_slip.download',
            'salary_structure.manage',
        ]);

        $teacher = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);
        $teacher->givePermissionTo([
            'academic.subject.view',
            'academic.attendance.view',
            'academic.attendance.create',
            'academic.marks.view',
            'academic.marks.create',
            'student.view',
            'salary_slip.view',
            'salary_slip.download',
            // Class incharge permissions (scope by class_incharges in controllers)
            'class_incharge.view',
            'class_incharge.students.view',
            'class_incharge.attendance.mark',
            'class_incharge.attendance.report',
            'class_incharge.leave.approve',
            'class_incharge.fee.view',
            'class_incharge.notice.post',
            'class_incharge.remark.create',
            'class_incharge.exam.view',
            'class_incharge.marks.view',
            'class_incharge.result.view',
            'class_incharge.report.view',
        ]);

        $classIncharge = Role::firstOrCreate(['name' => 'class_incharge', 'guard_name' => 'web']);
        $classIncharge->givePermissionTo([
            'academic.subject.view',
            'academic.attendance.view',
            'academic.attendance.create',
            'academic.marks.view',
            'academic.marks.create',
            'student.view',
            'class_incharge.view',
            'class_incharge.students.view',
            'class_incharge.attendance.mark',
            'class_incharge.attendance.report',
            'class_incharge.leave.approve',
            'class_incharge.fee.view',
            'class_incharge.notice.post',
            'class_incharge.remark.create',
            'class_incharge.exam.view',
            'class_incharge.marks.view',
            'class_incharge.result.view',
            'class_incharge.report.view',
            'class_incharge.activity.manage',
            'class_incharge.promotion.recommend',
            'class_incharge.parents.view',
            'class_incharge.timetable.view',
            'class_incharge.subjects.view',
        ]);

        $employee = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
        $employee->givePermissionTo([
            'salary_slip.view',
            'salary_slip.download',
        ]);

        $student = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $student->givePermissionTo([
            'student.view',
            'fee.own.view',
        ]);

        $parent = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);
        $parent->givePermissionTo([
            'fee.own.children.view',
        ]);
    }
}
