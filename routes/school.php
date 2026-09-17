<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Http\Controllers\Dashboard\SuperAdmin\DashboardController;
use App\Http\Controllers\Dashboard\SuperAdmin\UserManagementController;
use App\Http\Controllers\Dashboard\Accountant\AccountController;
use App\Http\Controllers\Dashboard\Accountant\FeeController;
use App\Http\Controllers\Dashboard\Admin\EmployeeController;
use App\Http\Controllers\Dashboard\Admin\AcademicController;
use App\Http\Controllers\Dashboard\Admin\StudentController;
use App\Http\Controllers\Dashboard\Admin\StudentBulkImportExportController;
use App\Http\Controllers\Dashboard\Admin\StudentEnrollmentController;
// use App\Http\Controllers\Dashboard\Admin\ParentController as AdminParentController;
use App\Http\Controllers\Dashboard\Admin\TransportController;
use App\Http\Controllers\Dashboard\Expense\ExpenseCategoryController;
use App\Http\Controllers\Dashboard\Expense\ExpenseController;
use App\Http\Controllers\Dashboard\Notice\NoticeCategoryController;
use App\Http\Controllers\Dashboard\Notice\NoticeController;
use App\Http\Controllers\Dashboard\Leave\LeaveTypeController;
use App\Http\Controllers\Dashboard\Leave\LeaveController;
use App\Http\Controllers\Dashboard\Leave\LeaveBalanceController;
use App\Http\Controllers\Dashboard\Setting\SystemSettingController;
use App\Http\Controllers\Dashboard\Setting\SchoolBrandingController;
use App\Http\Controllers\Dashboard\Setting\AuthSettingController;
use App\Http\Controllers\Dashboard\Setting\EmailSettingController;
use App\Http\Controllers\Dashboard\Expense\ExpenseBudgetController;
use App\Http\Controllers\Dashboard\Expense\VendorController;
use App\Http\Controllers\Dashboard\Admin\HostelController;
use App\Http\Controllers\Dashboard\Admin\LibraryController;
use App\Http\Controllers\Dashboard\Admin\ClassSectionController;
use App\Http\Controllers\Dashboard\TimeSlot\TimeSlotController;
use App\Http\Controllers\Dashboard\TimeTable\ClassRoomController;
use App\Http\Controllers\Dashboard\TimeTable\TimetableController;
use App\Http\Controllers\Dashboard\TimeTable\TeacherAvailabilityController;
use App\Http\Controllers\Dashboard\TimeTable\TimetableAdjustmentController;
use App\Http\Controllers\Dashboard\Admin\ClassInchargeController;
use App\Http\Controllers\Dashboard\ClassIncharge\ClassInchargeDashboardController;
use App\Http\Controllers\Dashboard\ClassIncharge\ClassNoticeController;
use App\Http\Controllers\Dashboard\ClassIncharge\ClassActivityController;
use App\Http\Controllers\Dashboard\ClassIncharge\PromotionRecommendationController;
use App\Http\Controllers\Dashboard\ClassIncharge\ClassParentsController;
use App\Http\Controllers\Dashboard\Admin\TeacherClassSubjectController;
use App\Http\Controllers\Dashboard\Admin\SubjectGroupController;
use App\Http\Controllers\Dashboard\Admin\ClassSectionGroupController;
use App\Http\Controllers\Dashboard\Admin\ClassSectionGroupSubjectController;
use App\Http\Controllers\Dashboard\Admin\MaterialController;
use App\Http\Controllers\Dashboard\Admin\ExamTypeController;
use App\Http\Controllers\Dashboard\Admin\GradeScaleController;
use App\Http\Controllers\Dashboard\Admin\ExamSubjectController;
use App\Http\Controllers\Dashboard\Admin\StudentExamRecordController;
use App\Http\Controllers\Dashboard\Admin\StudentExamResultController;
use App\Http\Controllers\Dashboard\Teacher\TeacherController;
use App\Http\Controllers\Dashboard\Teacher\TeacherAttendanceController;
use App\Http\Controllers\Dashboard\Teacher\StudentLeaveApplicationController;
use App\Http\Controllers\Dashboard\Teacher\MyLeaveController;
use App\Http\Controllers\Dashboard\Teacher\StudentRemarkController;
use App\Http\Controllers\Dashboard\Student\StudentController as StudentDashboardController;
use App\Http\Controllers\Dashboard\Employee\EmployeeController as EmployeeDashboardController;
use App\Http\Controllers\Dashboard\Employee\MyLeaveController as EmployeeMyLeaveController;
use App\Http\Controllers\Dashboard\Staff\MySalaryController;
use App\Http\Controllers\Dashboard\Parent\ParentController;
use App\Http\Controllers\Dashboard\Parent\StudentLeaveApplicationController as ParentLeaveApplicationController;
use App\Http\Controllers\Dashboard\Admin\ParentController as AdminParentController;
use App\Http\Controllers\Dashboard\Admin\StudentLeaveApplicationController as AdminStudentLeaveApplicationController;
use App\Http\Controllers\Dashboard\Admin\TeacherManagementController;
use App\Http\Controllers\Dashboard\Admin\PromotionController;
use App\Http\Controllers\Dashboard\Admin\ClassStudentReportController;
use App\Http\Controllers\Dashboard\Admin\AttendanceSessionController;
use App\Http\Controllers\Dashboard\Admin\AttendanceSettingsController;
use App\Http\Controllers\Dashboard\Admin\AttendanceReportController;
use App\Http\Controllers\Dashboard\Admin\AttendanceFreezeController;
use App\Http\Controllers\Dashboard\Admin\AttendanceCorrectionRequestController;
use App\Http\Controllers\Dashboard\Admin\AttendanceAuditLogController;
use App\Http\Controllers\Dashboard\Admin\FeeTypeController;
use App\Http\Controllers\Dashboard\Accountant\ScholarShipController;
use App\Http\Controllers\Dashboard\Accountant\StudentScholarShipController;
use App\Http\Controllers\Dashboard\Accountant\SiblingDiscountController;
use App\Http\Controllers\Dashboard\Accountant\LateFineRuleController;
use App\Http\Controllers\Dashboard\Accountant\InstallmentPlanController;
use App\Http\Controllers\Dashboard\Accountant\StudentInstallmentController;
use App\Http\Controllers\Dashboard\Accountant\InvoiceController;
use App\Http\Controllers\Dashboard\Accountant\InvoiceItemController;
use App\Http\Controllers\Dashboard\Accountant\InvoiceDiscountController;
use App\Http\Controllers\Dashboard\Accountant\PaymentController;
use App\Http\Controllers\Dashboard\Accountant\OverTimeChargeController;
use App\Http\Controllers\Dashboard\Accountant\StudentOptionalServiceController;
use App\Http\Controllers\Dashboard\Accountant\ClassFeeStructureController;
use App\Http\Controllers\Dashboard\Accountant\FeeReportController;
use App\Http\Controllers\Dashboard\Accountant\FeePaymentStatusController;
use App\Http\Controllers\Dashboard\GlobalSearchController;
use App\Http\Controllers\Dashboard\Accountant\RefundController;
use App\Http\Controllers\Dashboard\Accountant\InvoiceExportController;
use App\Http\Controllers\Dashboard\Accountant\AllowanceController;
use App\Http\Controllers\Dashboard\Accountant\DeductionController;
use App\Http\Controllers\Dashboard\Accountant\SalaryStructureController;
use App\Http\Controllers\Dashboard\Accountant\PayrollController;
use App\Http\Controllers\Dashboard\Accountant\SalaryAdvanceController;
use App\Http\Controllers\Dashboard\Accountant\OvertimePaymentController;
use App\Http\Controllers\Dashboard\Accountant\PayslipController;
use App\Http\Controllers\Api\InvoiceApiController;

// Role-based dashboard redirect
Route::get('/dashboard/redirect', function () {
    /** @var User|null $user */
    $user = Auth::user();
    
    if ($user && ($user->hasRole('super_admin') || $user->hasRole('admin'))) {
        return redirect()->route('dashboard.superadmin');
    } elseif ($user && $user->hasRole('accountant')) {
        return redirect()->route('dashboard.accountant');
    } elseif ($user && $user->hasRole('teacher')) {
        return redirect()->route('dashboard.teacher');
    } elseif ($user && $user->hasRole('student')) {
        return redirect()->route('dashboard.student');
    } elseif ($user && $user->hasRole('parent')) {
        return redirect()->route('dashboard.parent');
    } elseif ($user && $user->hasRole('employee')) {
        return redirect()->route('dashboard.employee');
    }
    
    return redirect('/');
})->middleware(['auth', 'verified'])->name('dashboard.redirect');

// Global header search (pages / students / teachers / employees)
Route::middleware(['auth'])->group(function () {
    Route::get('/search', [GlobalSearchController::class, 'search'])->name('global-search');
    Route::get('/search/meta', [GlobalSearchController::class, 'meta'])->name('global-search.meta');
});

// Super Admin Routes (guard 'web' so roles match Spatie's web guard) — admin can access same dashboard
Route::middleware(['auth', 'role:super_admin|admin,web'])->group(function () {
    Route::get('/superadmin/dashboard', [DashboardController::class, 'index'])->name('dashboard.superadmin');
    
    // User Management
    Route::get('/admin/user-management', function () {
        return inertia('dashboard/admin/UserManagement');
    })->name('admin.user-management');
    Route::get('/admin/academic-session', function () {
        return inertia('dashboard/academic/AcademicSession');
    })->name('admin.academic-session');
    Route::get('/admin/students-enrollments', function () {
        return inertia('dashboard/academic/StudentsEnrollments');
    })->name('admin.students-enrollments');
    Route::get('/admin/attendance-management', function () {
        return inertia('dashboard/attendance/AttendanceManagement');
    })->name('admin.attendance-management');
    Route::get('/admin/notice-management', function () {
        return inertia('dashboard/notice/NoticeManagement');
    })->name('admin.notice-management');
    Route::get('/admin/leave-management', function () {
        return inertia('dashboard/leave/LeaveManagement');
    })->name('admin.leave-management');
    Route::get('/admin/settings-management', function () {
        return inertia('dashboard/setting/SettingsManagement');
    })->name('admin.settings-management');
    Route::resource('/superadmin/users', UserManagementController::class)->names('superadmin.users');
    Route::patch('/superadmin/users/{user}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('superadmin.users.toggle-status');
});

Route::middleware(['auth', 'role:super_admin|admin|accountant|teacher|employee|class_incharge'])->group(function () {
    Route::get('/payroll/{payroll}/payslip', [PayslipController::class, 'download'])->name('payroll.payslip.download');
});

// Payroll — static paths MUST be before /accountant/payroll/{payroll} or they get matched as {payroll}
Route::middleware(['auth', 'role:super_admin|admin|accountant'])->group(function () {
    Route::get('/admin/payroll-management', function () {
        return inertia('dashboard/accountant/PayrollManagement');
    })->name('admin.payroll-management');
    Route::get('/admin/expense-management', function () {
        return inertia('dashboard/accountant/ExpenseManagement');
    })->name('admin.expense-management');
    Route::get('/accountant/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::get('/accountant/payroll/allowances', [AllowanceController::class, 'index'])->name('payroll.allowances.index');
    Route::post('/accountant/payroll/allowances', [AllowanceController::class, 'store'])->name('payroll.allowances.store');
    Route::put('/accountant/payroll/allowances/{allowance}', [AllowanceController::class, 'update'])->name('payroll.allowances.update');
    Route::delete('/accountant/payroll/allowances/{allowance}', [AllowanceController::class, 'destroy'])->name('payroll.allowances.destroy');
    Route::get('/accountant/payroll/deductions', [DeductionController::class, 'index'])->name('payroll.deductions.index');
    Route::post('/accountant/payroll/deductions', [DeductionController::class, 'store'])->name('payroll.deductions.store');
    Route::put('/accountant/payroll/deductions/{deduction}', [DeductionController::class, 'update'])->name('payroll.deductions.update');
    Route::delete('/accountant/payroll/deductions/{deduction}', [DeductionController::class, 'destroy'])->name('payroll.deductions.destroy');
    Route::get('/accountant/payroll/salary-structures', [SalaryStructureController::class, 'index'])->name('payroll.salary-structures.index');
    Route::post('/accountant/payroll/salary-structures', [SalaryStructureController::class, 'store'])->name('payroll.salary-structures.store');
    Route::put('/accountant/payroll/salary-structures/{salaryStructure}', [SalaryStructureController::class, 'update'])->name('payroll.salary-structures.update');
    Route::delete('/accountant/payroll/salary-structures/{salaryStructure}', [SalaryStructureController::class, 'destroy'])->name('payroll.salary-structures.destroy');
    Route::post('/accountant/payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
    Route::get('/accountant/payroll/slips', [PayrollController::class, 'slips'])->name('payroll.slips.index');
    Route::get('/accountant/payroll/reports', [PayrollController::class, 'reports'])->name('payroll.reports.index');
    Route::get('/accountant/payroll/advances', [SalaryAdvanceController::class, 'index'])->name('payroll.advances.index');
    Route::post('/accountant/payroll/advances', [SalaryAdvanceController::class, 'store'])->name('payroll.advances.store');
    Route::post('/accountant/payroll/advances/{salaryAdvance}/approve', [SalaryAdvanceController::class, 'approve'])->name('payroll.advances.approve');
    Route::post('/accountant/payroll/advances/{salaryAdvance}/reject', [SalaryAdvanceController::class, 'reject'])->name('payroll.advances.reject');
    Route::delete('/accountant/payroll/advances/{salaryAdvance}', [SalaryAdvanceController::class, 'destroy'])->name('payroll.advances.destroy');
    Route::get('/accountant/payroll/overtime', [OvertimePaymentController::class, 'index'])->name('payroll.overtime.index');
    Route::post('/accountant/payroll/overtime', [OvertimePaymentController::class, 'store'])->name('payroll.overtime.store');
    Route::put('/accountant/payroll/overtime/{overtimePayment}', [OvertimePaymentController::class, 'update'])->name('payroll.overtime.update');
    Route::delete('/accountant/payroll/overtime/{overtimePayment}', [OvertimePaymentController::class, 'destroy'])->name('payroll.overtime.destroy');
    Route::post('/accountant/payroll/{payroll}/approve', [PayrollController::class, 'approve'])->name('payroll.approve');
    Route::post('/accountant/payroll/{payroll}/pay', [PayrollController::class, 'pay'])->name('payroll.pay');
    Route::post('/accountant/payroll/{payroll}/cancel', [PayrollController::class, 'cancel'])->name('payroll.cancel');
    Route::get('/accountant/payroll/{payroll}', [PayrollController::class, 'show'])->name('payroll.show');
    Route::resource('expense-categories', ExpenseCategoryController::class);
    Route::resource('vendors', VendorController::class);
    Route::resource('expenses', ExpenseController::class);
    Route::get('expenses/export/pdf', [ExpenseController::class, 'exportPdf'])->name('expenses.export.pdf');
    Route::get('expenses/export/excel', [ExpenseController::class, 'exportExcel'])->name('expenses.export.excel');
    Route::post('expenses/{expense}/payments', [ExpenseController::class, 'storePayment'])->name('expenses.payments.store');
    Route::get('expense-budgets', [ExpenseBudgetController::class, 'index'])->name('expense-budgets.index');
    Route::post('expense-budgets', [ExpenseBudgetController::class, 'store'])->name('expense-budgets.store');
    Route::put('expense-budgets/{expense_budget}', [ExpenseBudgetController::class, 'update'])->name('expense-budgets.update');
    Route::delete('expense-budgets/{expense_budget}', [ExpenseBudgetController::class, 'destroy'])->name('expense-budgets.destroy');
    Route::resource('notice-categories', NoticeCategoryController::class);
    Route::resource('leave-types', LeaveTypeController::class);
    Route::resource('leaves', LeaveController::class);
    Route::post('leaves/{leave}/approve', [LeaveController::class, 'approve'])->name('leaves.approve');
    Route::post('leaves/{leave}/reject', [LeaveController::class, 'reject'])->name('leaves.reject');
    Route::get('leave-balances', [LeaveBalanceController::class, 'index'])->name('leave-balances.index');
    Route::post('leave-balances', [LeaveBalanceController::class, 'store'])->name('leave-balances.store');
    Route::get('student-leave-applications', [AdminStudentLeaveApplicationController::class, 'index'])->name('admin.student-leave-applications.index');
    Route::post('student-leave-applications/{leave}/approve', [AdminStudentLeaveApplicationController::class, 'approve'])->name('admin.student-leave-applications.approve');
    Route::post('student-leave-applications/{leave}/reject', [AdminStudentLeaveApplicationController::class, 'reject'])->name('admin.student-leave-applications.reject');
    Route::put('leave-balances/{leaveBalance}', [LeaveBalanceController::class, 'update'])->name('leave-balances.update');
    Route::get('settings/system', [SystemSettingController::class, 'index'])->name('settings.system.index');
    Route::post('settings/system', [SystemSettingController::class, 'store'])->name('settings.system.store');
    Route::put('settings/system/{systemSetting}', [SystemSettingController::class, 'update'])->name('settings.system.update');
    Route::delete('settings/system/{systemSetting}', [SystemSettingController::class, 'destroy'])->name('settings.system.destroy');
    Route::get('settings/branding', [SchoolBrandingController::class, 'index'])->name('settings.branding.index');
    Route::post('settings/branding', [SchoolBrandingController::class, 'update'])->name('settings.branding.update');
    Route::get('settings/auth', [AuthSettingController::class, 'index'])->name('settings.auth.index');
    Route::post('settings/auth', [AuthSettingController::class, 'update'])->name('settings.auth.update');
    Route::get('settings/email', [EmailSettingController::class, 'index'])->name('settings.email.index');
    Route::post('settings/email', [EmailSettingController::class, 'update'])->name('settings.email.update');
});

// Notices: all authenticated users (students, parents, teachers, employees, admin)
Route::middleware(['auth'])->group(function () {
    Route::resource('notices', NoticeController::class);
    Route::post('notices/{notice}/like', [NoticeController::class, 'like'])->name('notices.like');
    Route::post('notices/{notice}/comment', [NoticeController::class, 'comment'])->name('notices.comment');
    Route::get('notice-dashboard', [NoticeController::class, 'dashboard'])->name('notices.dashboard');
    Route::get('notice-analytics', [NoticeController::class, 'analytics'])->name('notices.analytics');
});

// Accountant Routes
Route::middleware(['auth', 'role:accountant|admin|super_admin,web'])->group(function () {
    Route::get('/admin/accountant-management', function () {
        return inertia('dashboard/accountant/AccountantManagement');
    })->name('admin.accountant-management');
    Route::get('/accountant/dashboard', [AccountController::class, 'index'])->name('dashboard.accountant');
    Route::get('/accountant/reports', [AccountController::class, 'reports'])->name('accountant.reports');
    Route::get('/accountant/income', fn () => redirect()->route('dashboard.accountant'))->name('accountant.income');
    Route::post('/accountant/income', [AccountController::class, 'incomeStore'])->name('accountant.income.store');
    Route::get('/accountant/expense', fn () => redirect()->route('dashboard.accountant'))->name('accountant.expense');
    Route::post('/accountant/expense', [AccountController::class, 'expenseStore'])->name('accountant.expense.store');
    
    // Fee Management
    Route::get('/accountant/fee/structure', [FeeController::class, 'feeStructure'])->name('fee.structure');
    Route::post('/accountant/fee/structure', [FeeController::class, 'feeStructureStore'])->name('fee.structure.store');
    Route::get('/accountant/fee/assign', [FeeController::class, 'feeAssign'])->name('fee.assign');
    Route::get('/accountant/fee/collection', [FeeController::class, 'feeCollection'])->name('fee.collection');
    Route::post('/accountant/fee/collect', [FeeController::class, 'collectFee'])->name('fee.collect');

    // Fee Types (Tuition, Admission, Transport, etc.)
    Route::get('/accountant/fee-types', [FeeTypeController::class, 'index'])->name('fee-types.index');
    Route::post('/accountant/fee-types', [FeeTypeController::class, 'store'])->name('fee-types.store');
    Route::put('/accountant/fee-types/{feeType}', [FeeTypeController::class, 'update'])->name('fee-types.update');
    Route::delete('/accountant/fee-types/{feeType}', [FeeTypeController::class, 'destroy'])->name('fee-types.destroy');

    // Scholarships (percentage or fixed amount discounts)
    Route::get('/accountant/scholarships', [ScholarShipController::class, 'index'])->name('scholarships.index');
    Route::post('/accountant/scholarships', [ScholarShipController::class, 'store'])->name('scholarships.store');
    Route::put('/accountant/scholarships/{scholarship}', [ScholarShipController::class, 'update'])->name('scholarships.update');
    Route::delete('/accountant/scholarships/{scholarship}', [ScholarShipController::class, 'destroy'])->name('scholarships.destroy');
    Route::get('/accountant/student-scholarships', [StudentScholarShipController::class, 'index'])->name('student-scholarships.index');
    Route::post('/accountant/student-scholarships', [StudentScholarShipController::class, 'store'])->name('student-scholarships.store');
    Route::delete('/accountant/student-scholarships/{studentScholarShip}', [StudentScholarShipController::class, 'destroy'])->name('student-scholarships.destroy');
    Route::get('/accountant/sibling-discounts', [SiblingDiscountController::class, 'index'])->name('sibling-discounts.index');
    Route::post('/accountant/sibling-discounts', [SiblingDiscountController::class, 'store'])->name('sibling-discounts.store');
    Route::put('/accountant/sibling-discounts/{siblingDiscount}', [SiblingDiscountController::class, 'update'])->name('sibling-discounts.update');
    Route::delete('/accountant/sibling-discounts/{siblingDiscount}', [SiblingDiscountController::class, 'destroy'])->name('sibling-discounts.destroy');
    Route::get('/accountant/late-fine-rules', [LateFineRuleController::class, 'index'])->name('late-fine-rules.index');
    Route::post('/accountant/late-fine-rules', [LateFineRuleController::class, 'store'])->name('late-fine-rules.store');
    Route::put('/accountant/late-fine-rules/{lateFineRule}', [LateFineRuleController::class, 'update'])->name('late-fine-rules.update');
    Route::delete('/accountant/late-fine-rules/{lateFineRule}', [LateFineRuleController::class, 'destroy'])->name('late-fine-rules.destroy');
    Route::get('/accountant/installment-plans', [InstallmentPlanController::class, 'index'])->name('installment-plans.index');
    Route::post('/accountant/installment-plans', [InstallmentPlanController::class, 'store'])->name('installment-plans.store');
    Route::put('/accountant/installment-plans/{installmentPlan}', [InstallmentPlanController::class, 'update'])->name('installment-plans.update');
    Route::delete('/accountant/installment-plans/{installmentPlan}', [InstallmentPlanController::class, 'destroy'])->name('installment-plans.destroy');
    Route::get('/accountant/student-installments', [StudentInstallmentController::class, 'index'])->name('student-installments.index');
    Route::post('/accountant/student-installments', [StudentInstallmentController::class, 'store'])->name('student-installments.store');
    Route::post('/accountant/student-installments/generate', [StudentInstallmentController::class, 'generate'])->name('student-installments.generate');
    Route::delete('/accountant/student-installments/{studentInstallment}', [StudentInstallmentController::class, 'destroy'])->name('student-installments.destroy');
    Route::get('/accountant/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/accountant/invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::get('/accountant/invoices/export/pdf', [InvoiceExportController::class, 'exportPdf'])->name('invoices.export.pdf');
    Route::get('/accountant/invoices/export/excel', [InvoiceExportController::class, 'exportExcel'])->name('invoices.export.excel');
    Route::get('/accountant/invoices/fee-slips', [InvoiceController::class, 'feeSlips'])->name('invoices.fee-slips');
    Route::post('/accountant/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('/accountant/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::put('/accountant/invoices/{invoice}/fine', [InvoiceController::class, 'updateFine'])->name('invoices.update-fine');
    Route::delete('/accountant/invoices/bulk', [InvoiceController::class, 'destroyBulk'])->name('invoices.destroy-bulk');
    Route::delete('/accountant/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
    Route::get('/accountant/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::post('/accountant/invoices/{invoice}/items', [InvoiceItemController::class, 'store'])->name('invoice-items.store');
    Route::put('/accountant/invoices/{invoice}/items/{invoice_item}', [InvoiceItemController::class, 'update'])->name('invoice-items.update');
    Route::delete('/accountant/invoices/{invoice}/items/{invoice_item}', [InvoiceItemController::class, 'destroy'])->name('invoice-items.destroy');
    Route::post('/accountant/invoices/{invoice}/discounts', [InvoiceDiscountController::class, 'store'])->name('invoice-discounts.store');
    Route::put('/accountant/invoices/{invoice}/discounts/{invoice_discount}', [InvoiceDiscountController::class, 'update'])->name('invoice-discounts.update');
    Route::delete('/accountant/invoices/{invoice}/discounts/{invoice_discount}', [InvoiceDiscountController::class, 'destroy'])->name('invoice-discounts.destroy');
    Route::post('/accountant/invoices/{invoice}/payments', [PaymentController::class, 'store'])->name('invoice-payments.store');
    Route::delete('/accountant/invoices/{invoice}/payments/{payment}', [PaymentController::class, 'destroy'])->name('invoice-payments.destroy');
    Route::post('/accountant/invoices/{invoice}/refunds', [RefundController::class, 'store'])->name('invoice-refunds.store');
    Route::get('/accountant/over-time-charges', [OverTimeChargeController::class, 'index'])->name('over-time-charges.index');
    Route::post('/accountant/over-time-charges', [OverTimeChargeController::class, 'store'])->name('over-time-charges.store');
    Route::put('/accountant/over-time-charges/{overTimeCharge}', [OverTimeChargeController::class, 'update'])->name('over-time-charges.update');
    Route::delete('/accountant/over-time-charges/{overTimeCharge}', [OverTimeChargeController::class, 'destroy'])->name('over-time-charges.destroy');
    Route::get('/accountant/student-optional-services', [StudentOptionalServiceController::class, 'index'])->name('student-optional-services.index');
    Route::post('/accountant/student-optional-services', [StudentOptionalServiceController::class, 'store'])->name('student-optional-services.store');
    Route::put('/accountant/student-optional-services/{studentOptionalService}', [StudentOptionalServiceController::class, 'update'])->name('student-optional-services.update');
    Route::delete('/accountant/student-optional-services/{studentOptionalService}', [StudentOptionalServiceController::class, 'destroy'])->name('student-optional-services.destroy');
    Route::get('/accountant/class-fee-structures', [ClassFeeStructureController::class, 'index'])->name('class-fee-structures.index');
    Route::get('/accountant/class-fee-structures/create', [ClassFeeStructureController::class, 'create'])->name('class-fee-structures.create');
    Route::post('/accountant/class-fee-structures', [ClassFeeStructureController::class, 'store'])->name('class-fee-structures.store');
    Route::get('/accountant/class-fee-structures/{classFeeStructure}/edit', [ClassFeeStructureController::class, 'edit'])->name('class-fee-structures.edit');
    Route::put('/accountant/class-fee-structures/{classFeeStructure}', [ClassFeeStructureController::class, 'update'])->name('class-fee-structures.update');
    Route::delete('/accountant/class-fee-structures/{classFeeStructure}', [ClassFeeStructureController::class, 'destroy'])->name('class-fee-structures.destroy');
    Route::get('/accountant/fee-reports', [FeeReportController::class, 'index'])->name('fee-reports.index');
    Route::get('/accountant/fee-payment-status', [FeePaymentStatusController::class, 'index'])->name('fee-payment-status.index');
    Route::get('/accountant/fee-payment-status/export/excel', [FeePaymentStatusController::class, 'exportExcel'])->name('fee-payment-status.export.excel');
    Route::get('/accountant/fee-payment-status/export/pdf', [FeePaymentStatusController::class, 'exportPdf'])->name('fee-payment-status.export.pdf');
});

// Shared invoice view/PDF (student/parent can view own or children's via policy)
Route::middleware(['auth'])->group(function () {
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.view');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.view.pdf');
});

// Fee API (auth required)
Route::prefix('api')->middleware(['auth'])->group(function () {
    Route::get('/invoices', [InvoiceApiController::class, 'index']);
    Route::get('/invoices/{invoice}', [InvoiceApiController::class, 'show']);
    Route::post('/invoices/{invoice}/payments', [InvoiceApiController::class, 'storePayment']);
});

// HR Routes
Route::middleware(['auth', 'role:admin|super_admin,web'])->group(function () {
    Route::get('/hr/employees', [EmployeeController::class, 'index'])->name('hr.employees');
    Route::get('/hr/employees/create', [EmployeeController::class, 'create'])->name('hr.employees.create');
    Route::post('/hr/employees', [EmployeeController::class, 'store'])->name('hr.employees.store');
    Route::get('/hr/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('hr.employees.edit');
    Route::patch('/hr/employees/{employee}', [EmployeeController::class, 'update'])->name('hr.employees.update');
    Route::get('/hr/employees/{employee}/salary', [EmployeeController::class, 'salary'])->name('hr.employees.salary');
    Route::post('/hr/employees/{employee}/pay-salary', [EmployeeController::class, 'paySalary'])->name('hr.employees.pay-salary');
    Route::get('/hr/leave-requests', [EmployeeController::class, 'leaveRequests'])->name('hr.leave-requests');
    Route::post('/hr/leave-requests/{leaveRequest}/approve', [EmployeeController::class, 'approveLeave'])->name('hr.leave.approve');
    Route::post('/hr/leave-requests/{leaveRequest}/reject', [EmployeeController::class, 'rejectLeave'])->name('hr.leave.reject');
});

// Academic Routes
Route::middleware(['auth', 'role:admin|super_admin|teacher|class_incharge,web'])->group(function () {
    Route::get('/admin/timetable-management', function () {
        $stats = app(\App\Http\Controllers\Dashboard\TimeTable\TimetableController::class)->hubStats();

        return inertia('dashboard/academic/TimeTableManagement', [
            'stats' => $stats,
        ]);
    })->name('admin.timetable-management');
    Route::get('/admin/exam-schedule', function () {
        return inertia('dashboard/academic/ExamSchedule');
    })->name('admin.exam-schedule');

    // Sessions
    Route::get('/academic/sessions', [AcademicController::class, 'sessions'])->name('academic.sessions');
    Route::post('/academic/sessions', [AcademicController::class, 'sessionStore'])->name('academic.sessions.store');
    Route::put('/academic/sessions/{session}', [AcademicController::class, 'sessionUpdate'])->name('academic.sessions.update');
    Route::delete('/academic/sessions/{session}', [AcademicController::class, 'sessionDestroy'])->name('academic.sessions.destroy');
    
    // Classes
    Route::get('/academic/classes', [AcademicController::class, 'classes'])->name('academic.classes');
    Route::post('/academic/classes', [AcademicController::class, 'classStore'])->name('academic.classes.store');
    Route::put('/academic/classes/{schoolClass}', [AcademicController::class, 'classUpdate'])->name('academic.classes.update');
    Route::delete('/academic/classes/{schoolClass}', [AcademicController::class, 'classDestroy'])->name('academic.classes.destroy');
    
    // Sections
    Route::get('/academic/sections', [AcademicController::class, 'sections'])->name('academic.sections');
    Route::post('/academic/sections', [AcademicController::class, 'sectionStore'])->name('academic.sections.store');
    Route::put('/academic/sections/{section}', [AcademicController::class, 'sectionUpdate'])->name('academic.sections.update');
    Route::delete('/academic/sections/{section}', [AcademicController::class, 'sectionDestroy'])->name('academic.sections.destroy');
    
    // Class Sections (session + class + section)
    Route::get('/academic/class-sections', [ClassSectionController::class, 'index'])->name('academic.class-sections');
    Route::post('/academic/class-sections', [ClassSectionController::class, 'store'])->name('academic.class-sections.store');
    Route::put('/academic/class-sections/{classSection}', [ClassSectionController::class, 'update'])->name('academic.class-sections.update');
    Route::delete('/academic/class-sections/{classSection}', [ClassSectionController::class, 'destroy'])->name('academic.class-sections.destroy');

    // Time Slots
    Route::get('/academic/time-slots', [TimeSlotController::class, 'index'])->name('academic.time-slots.index');
    Route::post('/academic/time-slots', [TimeSlotController::class, 'store'])->name('academic.time-slots.store');
    Route::put('/academic/time-slots/{timeSlot}', [TimeSlotController::class, 'update'])->name('academic.time-slots.update');
    Route::delete('/academic/time-slots/{timeSlot}', [TimeSlotController::class, 'destroy'])->name('academic.time-slots.destroy');

    // Class Rooms (timetable)
    Route::get('/academic/class-rooms', [ClassRoomController::class, 'index'])->name('academic.class-rooms.index');
    Route::post('/academic/class-rooms', [ClassRoomController::class, 'store'])->name('academic.class-rooms.store');
    Route::put('/academic/class-rooms/{classRoom}', [ClassRoomController::class, 'update'])->name('academic.class-rooms.update');
    Route::delete('/academic/class-rooms/{classRoom}', [ClassRoomController::class, 'destroy'])->name('academic.class-rooms.destroy');

    // Timetables
    Route::get('/academic/timetables', [TimetableController::class, 'index'])->name('academic.timetables.index');
    Route::get('/academic/timetables/create', [TimetableController::class, 'create'])->name('academic.timetables.create');
    Route::post('/academic/timetables', [TimetableController::class, 'store'])->name('academic.timetables.store');
    Route::get('/academic/timetable-views', [TimetableController::class, 'views'])->name('academic.timetable-views');
    Route::get('/academic/timetable-daily', [TimetableController::class, 'daily'])->name('academic.timetable-daily');
    Route::get('/academic/timetables/{timetable}/pdf', [TimetableController::class, 'pdf'])->name('academic.timetables.pdf');
    Route::get('/academic/timetables/{timetable}', [TimetableController::class, 'show'])->name('academic.timetables.show');
    Route::get('/academic/timetables/{timetable}/edit', [TimetableController::class, 'edit'])->name('academic.timetables.edit');
    Route::put('/academic/timetables/{timetable}', [TimetableController::class, 'update'])->name('academic.timetables.update');
    Route::delete('/academic/timetables/{timetable}', [TimetableController::class, 'destroy'])->name('academic.timetables.destroy');

    // Teacher Availabilities
    Route::get('/academic/teacher-availabilities', [TeacherAvailabilityController::class, 'index'])->name('academic.teacher-availabilities.index');
    Route::post('/academic/teacher-availabilities', [TeacherAvailabilityController::class, 'store'])->name('academic.teacher-availabilities.store');
    Route::post('/academic/teacher-availabilities/sync-week', [TeacherAvailabilityController::class, 'syncWeek'])->name('academic.teacher-availabilities.sync-week');
    Route::put('/academic/teacher-availabilities/{teacherAvailability}', [TeacherAvailabilityController::class, 'update'])->name('academic.teacher-availabilities.update');
    Route::delete('/academic/teacher-availabilities/{teacherAvailability}', [TeacherAvailabilityController::class, 'destroy'])->name('academic.teacher-availabilities.destroy');

    // Timetable Adjustments (read list; created automatically on teacher leave approval)
    Route::get('/academic/timetable-adjustments', [TimetableAdjustmentController::class, 'index'])->name('academic.timetable-adjustments.index');
    Route::put('/academic/timetable-adjustments/{timetableAdjustment}', [TimetableAdjustmentController::class, 'update'])->name('academic.timetable-adjustments.update');
    
    // Class Incharges
    Route::get('/academic/class-incharges', [ClassInchargeController::class, 'index'])->name('academic.class-incharges');
    Route::post('/academic/class-incharges', [ClassInchargeController::class, 'store'])->name('academic.class-incharges.store');
    Route::put('/academic/class-incharges/{classIncharge}', [ClassInchargeController::class, 'update'])->name('academic.class-incharges.update');
    Route::delete('/academic/class-incharges/{classIncharge}', [ClassInchargeController::class, 'destroy'])->name('academic.class-incharges.destroy');
    
    // Teacher-Class-Subject Assignments
    Route::get('/academic/teacher-class-subjects', [TeacherClassSubjectController::class, 'index'])->name('academic.teacher-class-subjects');
    Route::post('/academic/teacher-class-subjects', [TeacherClassSubjectController::class, 'store'])->name('academic.teacher-class-subjects.store');
    Route::put('/academic/teacher-class-subjects/{teacherClassSubject}', [TeacherClassSubjectController::class, 'update'])->name('academic.teacher-class-subjects.update');
    Route::delete('/academic/teacher-class-subjects/{teacherClassSubject}', [TeacherClassSubjectController::class, 'destroy'])->name('academic.teacher-class-subjects.destroy');
    
    // Subject Groups
    Route::get('/academic/subject-groups', [SubjectGroupController::class, 'index'])->name('academic.subject-groups');
    Route::post('/academic/subject-groups', [SubjectGroupController::class, 'store'])->name('academic.subject-groups.store');
    Route::put('/academic/subject-groups/{subjectGroup}', [SubjectGroupController::class, 'update'])->name('academic.subject-groups.update');
    Route::delete('/academic/subject-groups/{subjectGroup}', [SubjectGroupController::class, 'destroy'])->name('academic.subject-groups.destroy');

    // Class Section Groups (class section + subject group, e.g. Class 10-A + Science)
    Route::get('/academic/class-section-groups', [ClassSectionGroupController::class, 'index'])->name('academic.class-section-groups');
    Route::post('/academic/class-section-groups', [ClassSectionGroupController::class, 'store'])->name('academic.class-section-groups.store');
    Route::put('/academic/class-section-groups/{classSectionGroup}', [ClassSectionGroupController::class, 'update'])->name('academic.class-section-groups.update');
    Route::delete('/academic/class-section-groups/{classSectionGroup}', [ClassSectionGroupController::class, 'destroy'])->name('academic.class-section-groups.destroy');

    // Class Section Group Subjects (subjects + teacher per group, e.g. Science group → Physics, Chemistry + teachers)
    Route::get('/academic/class-section-group-subjects', [ClassSectionGroupSubjectController::class, 'index'])->name('academic.class-section-group-subjects');
    Route::post('/academic/class-section-group-subjects', [ClassSectionGroupSubjectController::class, 'store'])->name('academic.class-section-group-subjects.store');
    Route::put('/academic/class-section-group-subjects/{classSectionGroupSubject}', [ClassSectionGroupSubjectController::class, 'update'])->name('academic.class-section-group-subjects.update');
    Route::delete('/academic/class-section-group-subjects/{classSectionGroupSubject}', [ClassSectionGroupSubjectController::class, 'destroy'])->name('academic.class-section-group-subjects.destroy');

    // Subjects
    Route::get('/academic/subjects', [AcademicController::class, 'subjects'])->name('academic.subjects');
    Route::post('/academic/subjects', [AcademicController::class, 'subjectStore'])->name('academic.subjects.store');
    Route::put('/academic/subjects/{subject}', [AcademicController::class, 'subjectUpdate'])->name('academic.subjects.update');
    Route::delete('/academic/subjects/{subject}', [AcademicController::class, 'subjectDestroy'])->name('academic.subjects.destroy');
    
    // Exam Types (Mid Term, Final Term, etc.)
    Route::get('/academic/exam-types', [ExamTypeController::class, 'index'])->name('academic.exam-types.index');
    Route::post('/academic/exam-types', [ExamTypeController::class, 'store'])->name('academic.exam-types.store');
    Route::put('/academic/exam-types/{examType}', [ExamTypeController::class, 'update'])->name('academic.exam-types.update');
    Route::delete('/academic/exam-types/{examType}', [ExamTypeController::class, 'destroy'])->name('academic.exam-types.destroy');

    // Grade Scales (A+, A, B, etc.)
    Route::get('/academic/grade-scales', [GradeScaleController::class, 'index'])->name('academic.grade-scales.index');
    Route::post('/academic/grade-scales', [GradeScaleController::class, 'store'])->name('academic.grade-scales.store');
    Route::put('/academic/grade-scales/{gradeScale}', [GradeScaleController::class, 'update'])->name('academic.grade-scales.update');
    Route::delete('/academic/grade-scales/{gradeScale}', [GradeScaleController::class, 'destroy'])->name('academic.grade-scales.destroy');

    // Exams
    Route::get('/academic/exams', [AcademicController::class, 'exams'])->name('academic.exams');
    Route::get('/academic/exams/{exam}', [AcademicController::class, 'examShow'])->name('academic.exams.show');
    Route::post('/academic/exams', [AcademicController::class, 'examStore'])->name('academic.exams.store');
    Route::put('/academic/exams/{exam}', [AcademicController::class, 'examUpdate'])->name('academic.exams.update');
    Route::delete('/academic/exams/{exam}', [AcademicController::class, 'examDestroy'])->name('academic.exams.destroy');
    // Student Exam Records (marks entry per exam)
    Route::get('/academic/exams/{exam}/marks-entry', [StudentExamRecordController::class, 'marksEntry'])->name('academic.exams.marks-entry');
    Route::post('/academic/exams/{exam}/marks-entry', [StudentExamRecordController::class, 'storeBulk'])->name('academic.exams.marks-entry.store');
    // Exam Results (aggregate result per student per exam)
    Route::get('/academic/exams/{exam}/results', [StudentExamResultController::class, 'index'])->name('academic.exam-results.index');
    Route::post('/academic/exams/{exam}/results', [StudentExamResultController::class, 'store'])->name('academic.exam-results.store');
    Route::put('/academic/exam-results/{studentExamResult}', [StudentExamResultController::class, 'update'])->name('academic.exam-results.update');
    Route::delete('/academic/exam-results/{studentExamResult}', [StudentExamResultController::class, 'destroy'])->name('academic.exam-results.destroy');
    Route::get('/academic/exams/{exam}/results/sheet', [StudentExamResultController::class, 'resultSheet'])->name('academic.exam-results.sheet');
    Route::get('/academic/exams/{exam}/results/merit-list', [StudentExamResultController::class, 'meritList'])->name('academic.exam-results.merit-list');
    Route::get('/academic/exams/{exam}/results/result-card', [StudentExamResultController::class, 'resultCard'])->name('academic.exam-results.result-card');
    // Exam Subjects (per exam)
    Route::post('/academic/exams/{exam}/exam-subjects', [ExamSubjectController::class, 'store'])->name('academic.exam-subjects.store');
    Route::post('/academic/exams/{exam}/exam-subjects/sync', [ExamSubjectController::class, 'syncFromClass'])->name('academic.exam-subjects.sync');
    Route::get('/academic/exams/{exam}/date-sheet.pdf', [ExamSubjectController::class, 'dateSheetPdf'])->name('academic.exams.date-sheet');
    Route::put('/academic/exam-subjects/{examSubject}', [ExamSubjectController::class, 'update'])->name('academic.exam-subjects.update');
    Route::put('/academic/exam-subjects/{examSubject}/date-sheet', [ExamSubjectController::class, 'updateDateSheet'])->name('academic.exam-subjects.date-sheet');
    Route::delete('/academic/exam-subjects/{examSubject}', [ExamSubjectController::class, 'destroy'])->name('academic.exam-subjects.destroy');
    
    // Attendance Sessions (student, teacher, employee)
    Route::get('/attendance/sessions', [AttendanceSessionController::class, 'index'])->name('attendance.sessions.index');
    Route::get('/attendance/sessions/create', [AttendanceSessionController::class, 'create'])->name('attendance.sessions.create');
    Route::post('/attendance/sessions', [AttendanceSessionController::class, 'store'])->name('attendance.sessions.store');
    Route::get('/attendance/sessions/{attendanceSession}', [AttendanceSessionController::class, 'show'])->name('attendance.sessions.show');
    Route::get('/attendance/sessions/{attendanceSession}/edit', [AttendanceSessionController::class, 'edit'])->name('attendance.sessions.edit');
    Route::put('/attendance/sessions/{attendanceSession}', [AttendanceSessionController::class, 'update'])->name('attendance.sessions.update');
    Route::get('/attendance/sessions/{attendanceSession}/mark', [AttendanceSessionController::class, 'mark'])->name('attendance.sessions.mark');
    Route::post('/attendance/sessions/{attendanceSession}/mark', [AttendanceSessionController::class, 'markStore'])->name('attendance.sessions.mark.store');
    Route::post('/attendance/sessions/{attendanceSession}/bulk-mark-present', [AttendanceSessionController::class, 'bulkMarkPresent'])->name('attendance.sessions.bulk-mark-present');
    Route::post('/attendance/sessions/{attendanceSession}/lock', [AttendanceSessionController::class, 'lock'])->name('attendance.sessions.lock');
    Route::post('/attendance/sessions/{attendanceSession}/unlock', [AttendanceSessionController::class, 'unlock'])->name('attendance.sessions.unlock');
    Route::delete('/attendance/sessions/{attendanceSession}', [AttendanceSessionController::class, 'destroy'])->name('attendance.sessions.destroy');

    // Attendance Settings
    Route::get('/attendance/settings', [AttendanceSettingsController::class, 'index'])->name('attendance.settings.index');
    Route::post('/attendance/settings', [AttendanceSettingsController::class, 'store'])->name('attendance.settings.store');

    // Attendance Reports
    Route::get('/attendance/reports', [AttendanceReportController::class, 'index'])->name('attendance.reports.index');
    Route::get('/attendance/reports/student', [AttendanceReportController::class, 'studentReport'])->name('attendance.reports.student');
    Route::get('/attendance/reports/student/pdf', [AttendanceReportController::class, 'exportStudentMonthlyPdf'])->name('attendance.reports.student.pdf');
    Route::get('/attendance/reports/export/csv', [AttendanceReportController::class, 'exportCsv'])->name('attendance.reports.export.csv');
    Route::get('/attendance/reports/export/excel', [AttendanceReportController::class, 'exportExcel'])->name('attendance.reports.export.excel');
    Route::get('/attendance/reports/export/pdf', [AttendanceReportController::class, 'exportPdf'])->name('attendance.reports.export.pdf');

    // Attendance Monthly Freeze
    Route::get('/attendance/freeze', [AttendanceFreezeController::class, 'index'])->name('attendance.freeze.index');
    Route::post('/attendance/freeze', [AttendanceFreezeController::class, 'store'])->name('attendance.freeze.store');
    Route::delete('/attendance/freeze/{freeze}', [AttendanceFreezeController::class, 'destroy'])->name('attendance.freeze.destroy');

    // Attendance Correction Requests
    Route::get('/attendance/correction-requests', [AttendanceCorrectionRequestController::class, 'index'])->name('attendance.correction-requests.index');
    Route::put('/attendance/correction-requests/{correctionRequest}', [AttendanceCorrectionRequestController::class, 'update'])->name('attendance.correction-requests.update');

    // Attendance Audit Logs
    Route::get('/attendance/audit-logs', [AttendanceAuditLogController::class, 'index'])->name('attendance.audit-logs.index');

    // Marks
    Route::get('/academic/marks', [AcademicController::class, 'marks'])->name('academic.marks');
    Route::post('/academic/marks', [AcademicController::class, 'marksStore'])->name('academic.marks.store');
    
    // Students (Admin only) – only migration fields; enrollment handled separately
    Route::middleware(['role:admin|super_admin,web'])->group(function () {
        Route::get('/academic/students', [StudentController::class, 'index'])->name('academic.students');
        Route::get('/academic/students/create', [StudentController::class, 'create'])->name('academic.students.create');
        Route::get('/academic/students/next-roll-number', [StudentController::class, 'nextRollNumber'])->name('academic.students.next-roll-number');
        Route::post('/academic/students', [StudentController::class, 'store'])->name('academic.students.store');

        // Bulk Import & Export routes
        Route::get('/academic/students/import', [StudentBulkImportExportController::class, 'create'])->name('academic.students.import');
        Route::get('/academic/students/import/template', [StudentBulkImportExportController::class, 'downloadTemplate'])->name('academic.students.import.template');
        Route::post('/academic/students/import/parse', [StudentBulkImportExportController::class, 'parseFile'])->name('academic.students.import.parse');
        Route::post('/academic/students/import/validate', [StudentBulkImportExportController::class, 'validateRows'])->name('academic.students.import.validate');
        Route::post('/academic/students/import/execute', [StudentBulkImportExportController::class, 'executeImport'])->name('academic.students.import.execute');
        Route::get('/academic/students/export', [StudentBulkImportExportController::class, 'export'])->name('academic.students.export');

        Route::get('/academic/students/{student}', [StudentController::class, 'show'])->name('academic.students.show');
        Route::get('/academic/students/{student}/edit', [StudentController::class, 'edit'])->name('academic.students.edit');
        Route::patch('/academic/students/{student}', [StudentController::class, 'update'])->name('academic.students.update');
        Route::delete('/academic/students/{student}', [StudentController::class, 'destroy'])->name('academic.students.destroy');

        // Class & Students report (filter by session / class / section)
        Route::get('/academic/class-students', [ClassStudentReportController::class, 'index'])->name('academic.class-students');
        Route::get('/academic/class-students/export/csv', [ClassStudentReportController::class, 'exportCsv'])->name('academic.class-students.export.csv');
        Route::get('/academic/class-students/export/pdf', [ClassStudentReportController::class, 'exportPdf'])->name('academic.class-students.export.pdf');
        Route::get('/academic/class-students/{enrollment}/print', [ClassStudentReportController::class, 'print'])->name('academic.class-students.print');

        // Student Enrollments (class-section-group + student, roll number, status)
        Route::get('/academic/enrollments', [StudentEnrollmentController::class, 'index'])->name('academic.enrollments');
        Route::get('/academic/enrollments/export/csv', [StudentEnrollmentController::class, 'exportCsv'])->name('academic.enrollments.export.csv');
        Route::get('/academic/enrollments/export/pdf', [StudentEnrollmentController::class, 'exportPdf'])->name('academic.enrollments.export.pdf');
        Route::get('/academic/enrollments/{enrollment}', [StudentEnrollmentController::class, 'show'])->name('academic.enrollments.show');
        Route::post('/academic/enrollments', [StudentEnrollmentController::class, 'store'])->name('academic.enrollments.store');
        Route::patch('/academic/enrollments/{enrollment}', [StudentEnrollmentController::class, 'update'])->name('academic.enrollments.update');
        Route::delete('/academic/enrollments/{enrollment}', [StudentEnrollmentController::class, 'destroy'])->name('academic.enrollments.destroy');

        // Promotions (record student promotion from one enrollment/group to another)
        Route::get('/academic/promotions', [PromotionController::class, 'index'])->name('academic.promotions');
        Route::get('/academic/promotions/create', [PromotionController::class, 'create'])->name('academic.promotions.create');
        Route::post('/academic/promotions', [PromotionController::class, 'store'])->name('academic.promotions.store');
        Route::post('/academic/promotions/bulk', [PromotionController::class, 'storeBulk'])->name('academic.promotions.store-bulk');
        Route::get('/academic/promotions/{promotion}/edit', [PromotionController::class, 'edit'])->name('academic.promotions.edit');
        Route::patch('/academic/promotions/{promotion}', [PromotionController::class, 'update'])->name('academic.promotions.update');
        Route::delete('/academic/promotions/{promotion}', [PromotionController::class, 'destroy'])->name('academic.promotions.destroy');
    });
});

// Materials – admin/teacher full access; student/parent view & download only (controller returns canEdit and filters data by role)
Route::middleware(['auth', 'role:admin|super_admin|teacher|student|parent,web'])->group(function () {
    Route::get('/academic/materials', [MaterialController::class, 'index'])->name('academic.materials');
    Route::post('/academic/materials', [MaterialController::class, 'store'])->name('academic.materials.store');
    Route::put('/academic/materials/{material}', [MaterialController::class, 'update'])->name('academic.materials.update');
    Route::delete('/academic/materials/{material}', [MaterialController::class, 'destroy'])->name('academic.materials.destroy');
    Route::get('/academic/materials/{material}/download', [MaterialController::class, 'download'])->name('academic.materials.download');
});

// Parents (Admin only) – creates user with role 'parent' + parent profile
Route::middleware(['auth', 'role:admin|super_admin,web'])->group(function () {
    Route::get('/admin/parents', [AdminParentController::class, 'index'])->name('admin.parents');
    Route::get('/admin/parents/create', [AdminParentController::class, 'create'])->name('admin.parents.create');
    Route::post('/admin/parents', [AdminParentController::class, 'store'])->name('admin.parents.store');
    Route::post('/admin/parents/quick', [AdminParentController::class, 'storeQuick'])->name('admin.parents.store-quick');
    Route::get('/admin/parents/{parent}', [AdminParentController::class, 'show'])->name('admin.parents.show');
    Route::get('/admin/parents/{parent}/edit', [AdminParentController::class, 'edit'])->name('admin.parents.edit');
    Route::patch('/admin/parents/{parent}', [AdminParentController::class, 'update'])->name('admin.parents.update');
    Route::delete('/admin/parents/{parent}', [AdminParentController::class, 'destroy'])->name('admin.parents.destroy');
});

// Teachers (Admin only) – user_id from users with role 'teacher', with qualifications
Route::middleware(['auth', 'role:admin|super_admin,web'])->group(function () {
    Route::get('/admin/teachers', [TeacherManagementController::class, 'index'])->name('admin.teachers');
    Route::get('/admin/teachers/create', [TeacherManagementController::class, 'create'])->name('admin.teachers.create');
    Route::post('/admin/teachers', [TeacherManagementController::class, 'store'])->name('admin.teachers.store');
    Route::get('/admin/teachers/{teacher}', [TeacherManagementController::class, 'show'])->name('admin.teachers.show');
    Route::get('/admin/teachers/{teacher}/edit', [TeacherManagementController::class, 'edit'])->name('admin.teachers.edit');
    Route::patch('/admin/teachers/{teacher}', [TeacherManagementController::class, 'update'])->name('admin.teachers.update');
    Route::delete('/admin/teachers/{teacher}', [TeacherManagementController::class, 'destroy'])->name('admin.teachers.destroy');
});

// Class Incharge hub (role + active class_section assignment enforced in controllers)
Route::middleware(['auth', 'role:class_incharge,web'])->group(function () {
    Route::get('/class-incharge', [ClassInchargeDashboardController::class, 'index'])->name('class-incharge.dashboard');
    Route::get('/class-incharge/class-sections/{classSection}/subjects', [ClassInchargeDashboardController::class, 'subjects'])->name('class-incharge.subjects');
    Route::get('/class-incharge/class-sections/{classSection}/timetable', [ClassInchargeDashboardController::class, 'timetable'])->name('class-incharge.timetable');

    Route::get('/class-incharge/notices', [ClassNoticeController::class, 'index'])->name('class-incharge.notices.index');
    Route::get('/class-incharge/notices/create', [ClassNoticeController::class, 'create'])->name('class-incharge.notices.create');
    Route::post('/class-incharge/notices', [ClassNoticeController::class, 'store'])->name('class-incharge.notices.store');
    Route::get('/class-incharge/notices/{notice}/edit', [ClassNoticeController::class, 'edit'])->name('class-incharge.notices.edit');
    Route::put('/class-incharge/notices/{notice}', [ClassNoticeController::class, 'update'])->name('class-incharge.notices.update');
    Route::delete('/class-incharge/notices/{notice}', [ClassNoticeController::class, 'destroy'])->name('class-incharge.notices.destroy');

    Route::get('/class-incharge/activities', [ClassActivityController::class, 'index'])->name('class-incharge.activities.index');
    Route::post('/class-incharge/activities', [ClassActivityController::class, 'store'])->name('class-incharge.activities.store');
    Route::put('/class-incharge/activities/{activity}', [ClassActivityController::class, 'update'])->name('class-incharge.activities.update');
    Route::delete('/class-incharge/activities/{activity}', [ClassActivityController::class, 'destroy'])->name('class-incharge.activities.destroy');

    Route::get('/class-incharge/promotion-recommendations', [PromotionRecommendationController::class, 'index'])->name('class-incharge.promotion-recommendations.index');
    Route::post('/class-incharge/promotion-recommendations', [PromotionRecommendationController::class, 'store'])->name('class-incharge.promotion-recommendations.store');

    Route::get('/class-incharge/parents', [ClassParentsController::class, 'index'])->name('class-incharge.parents.index');
});

// Teacher / Class Incharge Routes (data scoped by class_incharges where applicable)
Route::middleware(['auth', 'role:teacher|class_incharge,web'])->group(function () {
    Route::get('/teacher/dashboard', [TeacherController::class, 'index'])->name('dashboard.teacher');
    Route::get('/teacher/students', [TeacherController::class, 'myStudents'])->name('teacher.students');
    Route::get('/teacher/attendance', [TeacherController::class, 'attendance'])->name('teacher.attendance');

    // Class Incharge – Student Attendance (sirf apni incharge class ka attendance)
    Route::get('/teacher/attendance/sessions', [TeacherAttendanceController::class, 'index'])->name('teacher.attendance.sessions');
    Route::get('/teacher/attendance/sessions/{attendanceSession}/mark', [TeacherAttendanceController::class, 'mark'])->name('teacher.attendance.sessions.mark');
    Route::post('/teacher/attendance/sessions/{attendanceSession}/mark', [TeacherAttendanceController::class, 'markStore'])->name('teacher.attendance.sessions.mark.store');
    Route::post('/teacher/attendance/sessions/{attendanceSession}/bulk-mark-present', [TeacherAttendanceController::class, 'bulkMarkPresent'])->name('teacher.attendance.sessions.bulk-mark-present');

    Route::get('/teacher/marks', [TeacherController::class, 'marks'])->name('teacher.marks');

    // Student leave applications (class incharge approve/reject) – teacher & class_incharge both
    Route::get('/teacher/leave-applications', [StudentLeaveApplicationController::class, 'index'])->name('teacher.leave-applications.index');
    Route::post('/teacher/leave-applications/{leave}/approve', [StudentLeaveApplicationController::class, 'approve'])->name('teacher.leave-applications.approve');
    Route::post('/teacher/leave-applications/{leave}/reject', [StudentLeaveApplicationController::class, 'reject'])->name('teacher.leave-applications.reject');

    // Teacher's own leave (apply, view, edit, delete) – admin approves via /leaves
    Route::get('/teacher/my-leaves', [MyLeaveController::class, 'index'])->name('teacher.my-leaves.index');
    Route::get('/teacher/my-leaves/create', [MyLeaveController::class, 'create'])->name('teacher.my-leaves.create');
    Route::post('/teacher/my-leaves', [MyLeaveController::class, 'store'])->name('teacher.my-leaves.store');
    Route::get('/teacher/my-leaves/{leave}', [MyLeaveController::class, 'show'])->name('teacher.my-leaves.show');
    Route::get('/teacher/my-leaves/{leave}/edit', [MyLeaveController::class, 'edit'])->name('teacher.my-leaves.edit');
    Route::put('/teacher/my-leaves/{leave}', [MyLeaveController::class, 'update'])->name('teacher.my-leaves.update');
    Route::delete('/teacher/my-leaves/{leave}', [MyLeaveController::class, 'destroy'])->name('teacher.my-leaves.destroy');

    Route::get('/teacher/salary', [MySalaryController::class, 'index'])->name('teacher.salary');
    Route::get('/teacher/salary-slips', [MySalaryController::class, 'slips'])->name('teacher.salary-slips');

    // Student remarks / discipline – teacher & class_incharge both (data scoped by class_incharges in controller)
    Route::get('/teacher/remarks', [StudentRemarkController::class, 'index'])->name('teacher.remarks.index');
    Route::get('/teacher/remarks/create', [StudentRemarkController::class, 'create'])->name('teacher.remarks.create');
    Route::post('/teacher/remarks', [StudentRemarkController::class, 'store'])->name('teacher.remarks.store');
    Route::delete('/teacher/remarks/{remark}', [StudentRemarkController::class, 'destroy'])->name('teacher.remarks.destroy');
});
// Student Routes
Route::middleware(['auth', 'role:student,web'])->group(function () {
    Route::get('/student/dashboard', [StudentDashboardController::class, 'index'])->name('dashboard.student');
    Route::get('/student/attendance', [StudentDashboardController::class, 'attendance'])->name('student.attendance');
    Route::get('/student/marks', [StudentDashboardController::class, 'marks'])->name('student.marks');
    Route::get('/student/fees', [StudentDashboardController::class, 'fees'])->name('student.fees');
    Route::get('/student/exams/{exam}/result-sheet', [StudentDashboardController::class, 'downloadResultSheet'])->name('student.exam-result-sheet');
    Route::get('/student/exams/{exam}/merit-list', [StudentDashboardController::class, 'downloadMeritList'])->name('student.exam-merit-list');
});

// Employee Routes
Route::middleware(['auth', 'role:employee,web'])->group(function () {
    Route::get('/employee/dashboard', [EmployeeDashboardController::class, 'index'])->name('dashboard.employee');
    Route::get('/employee/attendance', [EmployeeDashboardController::class, 'attendance'])->name('employee.attendance');
    Route::get('/employee/salary', [MySalaryController::class, 'index'])->name('employee.salary');
    Route::get('/employee/salary-slips', [MySalaryController::class, 'slips'])->name('employee.salary-slips');

    Route::get('/employee/my-leaves', [EmployeeMyLeaveController::class, 'index'])->name('employee.my-leaves.index');
    Route::get('/employee/my-leaves/create', [EmployeeMyLeaveController::class, 'create'])->name('employee.my-leaves.create');
    Route::post('/employee/my-leaves', [EmployeeMyLeaveController::class, 'store'])->name('employee.my-leaves.store');
    Route::get('/employee/my-leaves/{leave}', [EmployeeMyLeaveController::class, 'show'])->name('employee.my-leaves.show');
    Route::get('/employee/my-leaves/{leave}/edit', [EmployeeMyLeaveController::class, 'edit'])->name('employee.my-leaves.edit');
    Route::put('/employee/my-leaves/{leave}', [EmployeeMyLeaveController::class, 'update'])->name('employee.my-leaves.update');
    Route::delete('/employee/my-leaves/{leave}', [EmployeeMyLeaveController::class, 'destroy'])->name('employee.my-leaves.destroy');
});

Route::middleware(['auth', 'role:teacher|employee|class_incharge,web'])->group(function () {
    Route::get('/staff/salary', [MySalaryController::class, 'index'])->name('staff.salary');
    Route::get('/staff/salary-slips', [MySalaryController::class, 'slips'])->name('staff.salary-slips');
});

// Parent Routes
Route::middleware(['auth', 'role:parent,web'])->group(function () {
    Route::get('/parent/dashboard', [ParentController::class, 'index'])->name('dashboard.parent');
    Route::get('/parent/fee', [ParentController::class, 'fee'])->name('parent.fee');
    Route::get('/parent/children/{student}/attendance', [ParentController::class, 'childAttendance'])->name('parent.child.attendance');
    Route::get('/parent/children/{student}/marks', [ParentController::class, 'childMarks'])->name('parent.child.marks');
    Route::get('/parent/children/{student}/fees', [ParentController::class, 'childFees'])->name('parent.child.fees');
    Route::get('/parent/children/{student}/exams/{exam}/result-sheet', [ParentController::class, 'downloadChildResultSheet'])->name('parent.child.exam-result-sheet');
    Route::get('/parent/children/{student}/exams/{exam}/merit-list', [ParentController::class, 'downloadChildMeritList'])->name('parent.child.exam-merit-list');
    // Parent: Student Leave Applications (view, create, edit)
    Route::get('/parent/leave-applications', [ParentLeaveApplicationController::class, 'index'])->name('parent.leave-applications.index');
    Route::get('/parent/leave-applications/create', [ParentLeaveApplicationController::class, 'create'])->name('parent.leave-applications.create');
    Route::post('/parent/leave-applications', [ParentLeaveApplicationController::class, 'store'])->name('parent.leave-applications.store');
    Route::get('/parent/leave-applications/{leave}', [ParentLeaveApplicationController::class, 'show'])->name('parent.leave-applications.show');
    Route::get('/parent/leave-applications/{leave}/edit', [ParentLeaveApplicationController::class, 'edit'])->name('parent.leave-applications.edit');
    Route::put('/parent/leave-applications/{leave}', [ParentLeaveApplicationController::class, 'update'])->name('parent.leave-applications.update');
});

// Transport Routes
Route::middleware(['auth', 'role:admin|super_admin,web'])->group(function () {
    Route::get('/transport/vehicles', [TransportController::class, 'vehicles'])->name('transport.vehicles');
    Route::post('/transport/vehicles', [TransportController::class, 'vehicleStore'])->name('transport.vehicles.store');
    Route::get('/transport/routes', [TransportController::class, 'routes'])->name('transport.routes');
    Route::post('/transport/routes', [TransportController::class, 'routeStore'])->name('transport.routes.store');
    Route::put('/transport/routes/{route}', [TransportController::class, 'routeUpdate'])->name('transport.routes.update');
    Route::delete('/transport/routes/{route}', [TransportController::class, 'routeDestroy'])->name('transport.routes.destroy');
    Route::get('/transport/assignments', [TransportController::class, 'assignments'])->name('transport.assignments');
    Route::post('/transport/assignments', [TransportController::class, 'assignTransport'])->name('transport.assignments.store');
});

// Hostel Routes
Route::middleware(['auth', 'role:admin|super_admin,web'])->group(function () {
    Route::get('/hostel/hostels', [HostelController::class, 'hostels'])->name('hostel.hostels');
    Route::post('/hostel/hostels', [HostelController::class, 'hostelStore'])->name('hostel.hostels.store');
    Route::put('/hostel/hostels/{hostel}', [HostelController::class, 'hostelUpdate'])->name('hostel.hostels.update');
    Route::get('/hostel/rooms', [HostelController::class, 'rooms'])->name('hostel.rooms');
    Route::post('/hostel/rooms', [HostelController::class, 'roomStore'])->name('hostel.rooms.store');
    Route::get('/hostel/students', [HostelController::class, 'students'])->name('hostel.students');
    Route::post('/hostel/students', [HostelController::class, 'assignRoom'])->name('hostel.students.store');
});

// Library Routes
Route::middleware(['auth', 'role:admin|super_admin,web'])->group(function () {
    Route::get('/library/books', [LibraryController::class, 'books'])->name('library.books');
    Route::post('/library/books', [LibraryController::class, 'bookStore'])->name('library.books.store');
    Route::get('/library/issues', [LibraryController::class, 'issues'])->name('library.issues');
    Route::post('/library/issues', [LibraryController::class, 'issueBook'])->name('library.issues.store');
    Route::post('/library/issues/{issue}/return', [LibraryController::class, 'returnBook'])->name('library.issues.return');
});
