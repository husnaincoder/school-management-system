<?php

namespace App\Services\Search;

use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\User;

class GlobalSearchService
{
    /**
     * Extra module pages (beyond sidebar hubs) for search.
     *
     * @return array<int, array{label:string,routeName:string,keywords:string,roles:array<int,string>,group:string}>
     */
    public function searchablePages(): array
    {
        return [
            // Hubs
            ['label' => 'Dashboard', 'routeName' => 'dashboard.redirect', 'keywords' => 'home main', 'roles' => ['super_admin', 'admin', 'accountant', 'teacher', 'student', 'parent', 'employee'], 'group' => 'Main'],
            ['label' => 'User Management', 'routeName' => 'admin.user-management', 'keywords' => 'users roles', 'roles' => ['super_admin', 'admin'], 'group' => 'Users'],
            ['label' => 'Academic Session', 'routeName' => 'admin.academic-session', 'keywords' => 'session year class subject', 'roles' => ['super_admin', 'admin'], 'group' => 'Academic'],
            ['label' => 'Time Table Management', 'routeName' => 'admin.timetable-management', 'keywords' => 'timetable schedule', 'roles' => ['super_admin', 'admin', 'teacher'], 'group' => 'Academic'],
            ['label' => 'Students & Enrollments', 'routeName' => 'admin.students-enrollments', 'keywords' => 'students enrollments admission', 'roles' => ['super_admin', 'admin'], 'group' => 'Students'],
            ['label' => 'Attendance Management', 'routeName' => 'admin.attendance-management', 'keywords' => 'attendance present absent', 'roles' => ['super_admin', 'admin'], 'group' => 'Attendance'],
            ['label' => 'Exam & Schedule', 'routeName' => 'admin.exam-schedule', 'keywords' => 'exam marks results', 'roles' => ['super_admin', 'admin', 'teacher'], 'group' => 'Exam'],
            ['label' => 'Accountant Management', 'routeName' => 'admin.accountant-management', 'keywords' => 'fees accountant billing', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Payroll Management', 'routeName' => 'admin.payroll-management', 'keywords' => 'salary payroll', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Payroll'],
            ['label' => 'Expense Management', 'routeName' => 'admin.expense-management', 'keywords' => 'expense vendor budget', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Expense'],
            ['label' => 'Notice Management', 'routeName' => 'admin.notice-management', 'keywords' => 'notice announcement', 'roles' => ['super_admin', 'admin'], 'group' => 'Notice'],
            ['label' => 'Leave Management', 'routeName' => 'admin.leave-management', 'keywords' => 'leave application', 'roles' => ['super_admin', 'admin'], 'group' => 'Leave'],
            ['label' => 'Settings', 'routeName' => 'admin.settings-management', 'keywords' => 'settings branding email', 'roles' => ['super_admin', 'admin'], 'group' => 'Settings'],

            // Students
            ['label' => 'Students', 'routeName' => 'academic.students', 'keywords' => 'student list admission', 'roles' => ['super_admin', 'admin'], 'group' => 'Students'],
            ['label' => 'Enrollments', 'routeName' => 'academic.enrollments', 'keywords' => 'enrollment class section', 'roles' => ['super_admin', 'admin'], 'group' => 'Students'],
            ['label' => 'Teachers', 'routeName' => 'admin.teachers', 'keywords' => 'teacher staff faculty', 'roles' => ['super_admin', 'admin'], 'group' => 'Users'],
            ['label' => 'Employees', 'routeName' => 'hr.employees', 'keywords' => 'employee hr staff', 'roles' => ['super_admin', 'admin'], 'group' => 'Users'],

            // Fees
            ['label' => 'Invoices', 'routeName' => 'invoices.index', 'keywords' => 'invoice fee bill voucher', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Fee Payment Status', 'routeName' => 'fee-payment-status.index', 'keywords' => 'paid unpaid fee status', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Fee Reports', 'routeName' => 'fee-reports.index', 'keywords' => 'fee report collection', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Fee Types', 'routeName' => 'fee-types.index', 'keywords' => 'fee type tuition', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Class Fee Structure', 'routeName' => 'class-fee-structures.index', 'keywords' => 'class fee structure', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Scholarships', 'routeName' => 'scholarships.index', 'keywords' => 'scholarship discount', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Student Scholarships', 'routeName' => 'student-scholarships.index', 'keywords' => 'student scholarship', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Sibling Discounts', 'routeName' => 'sibling-discounts.index', 'keywords' => 'sibling discount', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Late Fine Rules', 'routeName' => 'late-fine-rules.index', 'keywords' => 'late fine', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Installment Plans', 'routeName' => 'installment-plans.index', 'keywords' => 'installment plan', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Student Installments', 'routeName' => 'student-installments.index', 'keywords' => 'student installment', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
            ['label' => 'Over Time Charges', 'routeName' => 'over-time-charges.index', 'keywords' => 'overtime charges', 'roles' => ['super_admin', 'admin', 'accountant'], 'group' => 'Fees'],
        ];
    }

    /**
     * @return array{pages:array<int,mixed>,students:array<int,mixed>,teachers:array<int,mixed>,employees:array<int,mixed>}
     */
    public function search(
        User $user,
        string $query,
        ?string $type = null,
        ?int $academicSessionId = null,
        ?int $classId = null,
        ?int $sectionId = null,
        ?string $feeStatus = null,
        ?string $paymentMethod = null,
        int $limit = 8
    ): array {
        $q = trim($query);
        $type = $type ?: 'all';
        $roles = $this->roleNames($user);
        $billingMonth = now()->format('Y-m');

        // Typing "cash" / "bank" etc. can act as payment-method filter for students.
        $methodAliases = ['cash', 'bank', 'card', 'online', 'cheque'];
        if ($paymentMethod === null && in_array(strtolower($q), $methodAliases, true)) {
            $paymentMethod = strtolower($q);
            if ($type === 'all') {
                $type = 'students';
            }
        }

        $result = [
            'pages' => [],
            'students' => [],
            'teachers' => [],
            'employees' => [],
            'billing_month' => $billingMonth,
        ];

        $hasStudentScope = $academicSessionId || $classId || $sectionId || $feeStatus || $paymentMethod;
        if ($q === '' && ! ($type === 'students' && $hasStudentScope)) {
            return $result;
        }

        if (in_array($type, ['all', 'pages'], true) && $paymentMethod === null) {
            $result['pages'] = $this->searchPages($roles, $q, $limit);
        }

        if (in_array($type, ['all', 'students'], true) && $this->canSearchStudents($roles)) {
            $result['students'] = $this->searchStudents(
                $q,
                $academicSessionId,
                $classId,
                $sectionId,
                $feeStatus,
                $paymentMethod,
                $billingMonth,
                $limit
            );
        }

        if (in_array($type, ['all', 'teachers'], true) && $this->canSearchStaff($roles) && $paymentMethod === null) {
            $result['teachers'] = $this->searchTeachers($q, $limit);
        }

        if (in_array($type, ['all', 'employees'], true) && $this->canSearchStaff($roles) && $paymentMethod === null) {
            $result['employees'] = $this->searchEmployees($q, $limit);
        }

        return $result;
    }

    /**
     * Session → class → section tree for student filters.
     *
     * @return array<int, array{id:int,name:string,classes:array<int,mixed>}>
     */
    public function filterTree(): array
    {
        $sessions = AcademicSession::query()->orderByDesc('start_date')->get(['id', 'name']);
        $classSections = ClassSection::query()
            ->with(['class:id,name', 'section:id,name'])
            ->get(['id', 'academic_session_id', 'class_id', 'section_id']);

        return $sessions->map(function (AcademicSession $session) use ($classSections) {
            $rows = $classSections->where('academic_session_id', $session->id)->values();
            $classIds = $rows->pluck('class_id')->unique()->filter()->values();

            $classes = $classIds->map(function ($classId) use ($rows) {
                $classId = (int) $classId;
                $className = $rows->firstWhere('class_id', $classId)?->class?->name ?? ('Class #'.$classId);
                $sections = $rows->where('class_id', $classId)
                    ->pluck('section_id')
                    ->filter()
                    ->unique()
                    ->values()
                    ->map(function ($sectionId) use ($rows, $classId) {
                        $sectionId = (int) $sectionId;
                        $sectionName = $rows->where('class_id', $classId)->firstWhere('section_id', $sectionId)?->section?->name
                            ?? ('Section #'.$sectionId);

                        return ['id' => $sectionId, 'name' => $sectionName];
                    })->values()->all();

                return [
                    'id' => $classId,
                    'name' => $className,
                    'sections' => $sections,
                ];
            })->values()->all();

            return [
                'id' => (int) $session->id,
                'name' => $session->name,
                'classes' => $classes,
            ];
        })->values()->all();
    }

    /**
     * @param  array<int, string>  $roles
     * @return array<int, array<string, mixed>>
     */
    private function searchPages(array $roles, string $q, int $limit): array
    {
        $needle = strtolower($q);

        return collect($this->searchablePages())
            ->filter(fn (array $page) => count(array_intersect($roles, $page['roles'])) > 0)
            ->filter(function (array $page) use ($needle) {
                if ($needle === '') {
                    return false;
                }
                $hay = strtolower($page['label'].' '.$page['keywords'].' '.$page['group']);

                return str_contains($hay, $needle);
            })
            ->take($limit)
            ->map(function (array $page) {
                $url = null;
                try {
                    $url = route($page['routeName']);
                } catch (\Throwable) {
                    $url = null;
                }

                return [
                    'type' => 'page',
                    'id' => $page['routeName'],
                    'title' => $page['label'],
                    'subtitle' => $page['group'].' page',
                    'url' => $url,
                    'group' => $page['group'],
                ];
            })
            ->filter(fn ($row) => ! empty($row['url']))
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchStudents(
        string $q,
        ?int $academicSessionId,
        ?int $classId,
        ?int $sectionId,
        ?string $feeStatus,
        ?string $paymentMethod,
        string $billingMonth,
        int $limit
    ): array {
        $enrollmentQuery = StudentEnrollment::query()
            ->with([
                'student.user:id,name,email,phone',
                'student.parent.user:id,name,phone,email',
                'student.parent:id,user_id,spouse_name,relation_with_student,occupation,address,city',
                'student:id,user_id,parent_id,first_name,last_name,admission_number,gender,cnic,date_of_birth,address',
                'classSectionGroup.classSection.class:id,name',
                'classSectionGroup.classSection.section:id,name',
                'classSectionGroup.classSection.academicSession:id,name',
            ])
            ->where(function ($w) {
                $w->whereNull('status')->orWhere('status', 'active');
            });

        if ($academicSessionId || $classId || $sectionId) {
            $enrollmentQuery->whereHas('classSectionGroup.classSection', function ($q) use ($academicSessionId, $classId, $sectionId) {
                if ($academicSessionId) {
                    $q->where('academic_session_id', $academicSessionId);
                }
                if ($classId) {
                    $q->where('class_id', $classId);
                }
                if ($sectionId) {
                    $q->where('section_id', $sectionId);
                }
            });
        }

        // Name/roll search — skip when query is only a payment method alias.
        $methodAliases = ['cash', 'bank', 'card', 'online', 'cheque'];
        $isMethodOnlyQuery = in_array(strtolower($q), $methodAliases, true);
        if ($q !== '' && ! $isMethodOnlyQuery) {
            $enrollmentQuery->where(function ($w) use ($q) {
                $w->where('roll_number', 'like', '%'.$q.'%')
                    ->orWhereHas('student', function ($s) use ($q) {
                        $s->where('admission_number', 'like', '%'.$q.'%')
                            ->orWhere('first_name', 'like', '%'.$q.'%')
                            ->orWhere('last_name', 'like', '%'.$q.'%')
                            ->orWhere('cnic', 'like', '%'.$q.'%')
                            ->orWhereHas('user', function ($u) use ($q) {
                                $u->where('name', 'like', '%'.$q.'%')
                                    ->orWhere('email', 'like', '%'.$q.'%')
                                    ->orWhere('phone', 'like', '%'.$q.'%');
                            });
                    });
            });
        }

        if ($paymentMethod) {
            $enrollmentQuery->whereHas('invoices.payments', function ($p) use ($paymentMethod, $billingMonth) {
                $p->where('method', $paymentMethod)
                    ->where(function ($w) use ($billingMonth) {
                        $w->whereYear('payment_date', (int) substr($billingMonth, 0, 4))
                            ->whereMonth('payment_date', (int) substr($billingMonth, 5, 2));
                    });
            });
        }

        $enrollments = $enrollmentQuery
            ->orderBy('roll_number')
            ->limit(max($limit * 3, 24))
            ->get();

        $enrollmentIds = $enrollments->pluck('id')->all();
        $invoicesByEnrollment = Invoice::query()
            ->whereIn('student_enrollment_id', $enrollmentIds ?: [-1])
            ->where(function ($q) use ($billingMonth) {
                $q->where('billing_month', $billingMonth)
                    ->orWhere(function ($q2) use ($billingMonth) {
                        $q2->whereNull('billing_month')
                            ->whereRaw("DATE_FORMAT(issue_date, '%Y-%m') = ?", [$billingMonth]);
                    });
            })
            ->orderByDesc('id')
            ->get()
            ->groupBy('student_enrollment_id');

        $rows = [];
        foreach ($enrollments as $en) {
            $student = $en->student;
            if (! $student) {
                continue;
            }

            $studentInvoices = ($invoicesByEnrollment->get($en->id) ?? collect())->values();
            $fee = $this->buildFeeSummary($studentInvoices, $billingMonth);

            if ($feeStatus && $feeStatus !== 'all' && $fee['status'] !== $feeStatus) {
                continue;
            }

            $name = $student->user?->name
                ?: trim(($student->first_name ?? '').' '.($student->last_name ?? ''));
            $cs = $en->classSectionGroup?->classSection;
            $session = $cs?->academicSession?->name ?? '—';
            $class = $cs?->class?->name ?? '—';
            $section = $cs?->section?->name ?? '—';

            $parentName = $student->parent?->user?->name;

            $rows[] = [
                'type' => 'student',
                'id' => (int) $student->id,
                'enrollment_id' => (int) $en->id,
                'title' => $name !== '' ? $name : 'Student #'.$student->id,
                'subtitle' => trim(($en->roll_number ?: 'No roll').' · '.$session.' · '.$class.' · '.$section),
                'meta' => [
                    'admission_number' => $student->admission_number,
                    'roll_number' => $en->roll_number,
                    'session' => $session,
                    'class' => $class,
                    'section' => $section,
                    'email' => $student->user?->email,
                    'phone' => $student->user?->phone,
                    'gender' => $student->gender,
                    'cnic' => $student->cnic,
                    'date_of_birth' => optional($student->date_of_birth)->format('Y-m-d'),
                    'address' => $student->address,
                    'parent_name' => $parentName,
                    'parent_phone' => $student->parent?->user?->phone,
                    'parent_relation' => $student->parent?->relation_with_student,
                    'parent_occupation' => $student->parent?->occupation,
                ],
                'fee' => $fee,
                'url' => route('academic.students.show', $student->id),
                'profile_url' => route('academic.students.show', $student->id),
                'invoice_url' => $fee['invoice_id'] ? route('invoices.show', $fee['invoice_id']) : null,
            ];

            if (count($rows) >= $limit) {
                break;
            }
        }

        return $rows;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Invoice>  $invoices
     * @return array<string, mixed>
     */
    private function buildFeeSummary($invoices, string $billingMonth): array
    {
        if ($invoices->isEmpty()) {
            return [
                'billing_month' => $billingMonth,
                'billing_month_label' => now()->format('F Y'),
                'status' => 'no_invoice',
                'status_label' => 'No Invoice ('.now()->format('M Y').')',
                'invoice_id' => null,
                'invoice_no' => null,
                'invoice_count' => 0,
                'total_amount' => 0.0,
                'paid_amount' => 0.0,
                'balance' => 0.0,
                'can_collect' => false,
            ];
        }

        $total = (float) $invoices->sum('total_amount');
        $paid = (float) $invoices->sum('paid_amount');
        $balance = (float) $invoices->sum('balance');
        $latest = $invoices->first();

        if ($balance <= 0.009 && $paid > 0) {
            $status = 'paid';
            $statusLabel = 'Paid';
        } elseif ($paid > 0 && $balance > 0) {
            $status = 'partial';
            $statusLabel = 'Partial';
        } else {
            $status = 'unpaid';
            $statusLabel = 'Unpaid';
        }

        // Prefer an unpaid/partial invoice for collect action.
        $collectInvoice = $invoices->first(fn (Invoice $inv) => (float) $inv->balance > 0) ?? $latest;

        return [
            'billing_month' => $billingMonth,
            'billing_month_label' => now()->format('F Y'),
            'status' => $status,
            'status_label' => $statusLabel.' ('.now()->format('M Y').')',
            'invoice_id' => $collectInvoice ? (int) $collectInvoice->id : null,
            'invoice_no' => $invoices->pluck('invoice_no')->filter()->implode(', '),
            'invoice_count' => $invoices->count(),
            'total_amount' => $total,
            'paid_amount' => $paid,
            'balance' => $balance,
            'collect_balance' => $collectInvoice ? (float) $collectInvoice->balance : 0.0,
            'can_collect' => $collectInvoice && (float) $collectInvoice->balance > 0,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchTeachers(string $q, int $limit): array
    {
        if ($q === '') {
            return [];
        }

        return Teacher::query()
            ->with('user:id,name,email,phone')
            ->where(function ($w) use ($q) {
                $w->where('staff_id', 'like', '%'.$q.'%')
                    ->orWhere('department', 'like', '%'.$q.'%')
                    ->orWhere('designation', 'like', '%'.$q.'%')
                    ->orWhere('specialization', 'like', '%'.$q.'%')
                    ->orWhereHas('user', function ($u) use ($q) {
                        $u->where('name', 'like', '%'.$q.'%')
                            ->orWhere('email', 'like', '%'.$q.'%')
                            ->orWhere('phone', 'like', '%'.$q.'%');
                    });
            })
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(function (Teacher $teacher) {
                $name = $teacher->user?->name ?: ('Teacher #'.$teacher->id);

                return [
                    'type' => 'teacher',
                    'id' => (int) $teacher->id,
                    'title' => $name,
                    'subtitle' => trim(($teacher->staff_id ?: 'Staff').' · '.($teacher->designation ?: 'Teacher').' · '.($teacher->department ?: '')),
                    'meta' => [
                        'staff_id' => $teacher->staff_id,
                        'department' => $teacher->department,
                        'designation' => $teacher->designation,
                        'specialization' => $teacher->specialization,
                        'experience' => $teacher->experience,
                        'joining_date' => optional($teacher->joining_date)->format('Y-m-d'),
                        'email' => $teacher->user?->email,
                        'phone' => $teacher->user?->phone,
                        'status' => $teacher->status,
                        'address' => $teacher->address,
                        'emergency_contact' => $teacher->emergency_contact,
                        'emergency_phone' => $teacher->emergency_phone,
                        'is_active' => $teacher->is_active,
                    ],
                    'url' => route('admin.teachers.show', $teacher->id),
                    'profile_url' => route('admin.teachers.show', $teacher->id),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function searchEmployees(string $q, int $limit): array
    {
        if ($q === '') {
            return [];
        }

        return Employee::query()
            ->with('user:id,name,email,phone')
            ->where(function ($w) use ($q) {
                $w->where('employee_id', 'like', '%'.$q.'%')
                    ->orWhere('department', 'like', '%'.$q.'%')
                    ->orWhere('designation', 'like', '%'.$q.'%')
                    ->orWhereHas('user', function ($u) use ($q) {
                        $u->where('name', 'like', '%'.$q.'%')
                            ->orWhere('email', 'like', '%'.$q.'%')
                            ->orWhere('phone', 'like', '%'.$q.'%');
                    });
            })
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(function (Employee $employee) {
                $name = $employee->user?->name ?: ('Employee #'.$employee->id);

                return [
                    'type' => 'employee',
                    'id' => (int) $employee->id,
                    'title' => $name,
                    'subtitle' => trim(($employee->employee_id ?: 'Emp').' · '.($employee->designation ?: 'Staff').' · '.($employee->department ?: '')),
                    'meta' => [
                        'employee_id' => $employee->employee_id,
                        'department' => $employee->department,
                        'designation' => $employee->designation,
                        'qualification' => $employee->qualification,
                        'experience' => $employee->experience,
                        'joining_date' => optional($employee->joining_date)->format('Y-m-d'),
                        'email' => $employee->user?->email,
                        'phone' => $employee->user?->phone,
                        'status' => $employee->status,
                        'address' => $employee->address,
                        'emergency_contact' => $employee->emergency_contact,
                        'emergency_phone' => $employee->emergency_phone,
                    ],
                    'url' => route('hr.employees.edit', $employee->id),
                    'profile_url' => route('hr.employees.edit', $employee->id),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    private function roleNames(User $user): array
    {
        return $user->getRoleNames()->map(fn ($r) => (string) $r)->values()->all();
    }

    /**
     * @param  array<int, string>  $roles
     */
    private function canSearchStudents(array $roles): bool
    {
        return count(array_intersect($roles, ['super_admin', 'admin', 'accountant'])) > 0;
    }

    /**
     * @param  array<int, string>  $roles
     */
    private function canSearchStaff(array $roles): bool
    {
        return count(array_intersect($roles, ['super_admin', 'admin'])) > 0;
    }

    /**
     * @param  array<int, string>  $roles
     */
    public function canCollectFee(array $roles): bool
    {
        return count(array_intersect($roles, ['super_admin', 'admin', 'accountant'])) > 0;
    }
}
