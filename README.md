# School Management System

A comprehensive, role-based School Management System built with **Laravel 10**, **Inertia.js**, and **React**.

---

## Key Features

- **Multi-Role Authentication & Access Control**: Super Admin, Admin, Teacher, Accountant, Parent, and Student.
- **Academic Structure Management**: Academic Sessions, Classes, Sections, Subject Groups, and Class Section Groups.
- **Student Admissions & Enrollments**: Dynamic collision-free student number and roll number generation.
- **Student Bulk Import & Export Wizard**:
  - Drag-and-drop file upload supporting `.csv`, `.tsv`, and `.xlsx` (Excel).
  - Flexible column mapping with auto-suggestions.
  - Multi-layer validation (health score bar, intra-file duplicates, CNIC checks, future birthdates).
  - Dynamic Class Section Group auto-provisioning.
  - Bulk student user and portal credentials provisioning.
  - Companion directory export to CSV.
- **Attendance Management**: Daily student and staff attendance tracking.
- **Examination & Marks Management**: Exam schedules, mark sheets, grade scales, and result generation.
- **Fee Management**: Fee categories, class fee structures, invoicing, sibling discounts, installment plans, and collection reports.
- **Payroll & Human Resources**: Employee directory, salary structures, payroll generation, advance requests, and payslips.
- **Notice Board & Internal Messaging**: Targeted notice publishing by role and department.

---

## Quick Setup Guide

### 1. Clone Repository
```bash
git clone https://github.com/husnaincoder/school-management-system.git
cd school-management-system
```

### 2. Install Dependencies
```bash
composer install
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
php artisan key:generate
```
Edit `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_management
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Run Migrations & Seeders
```bash
php artisan migrate --seed
php artisan storage:link
```

### 5. Build Assets (Pre-built assets are included in `public/build`)
```bash
npm run build
```

### 6. Start Local Server
```bash
php artisan serve
```
Open [`http://127.0.0.1:8000`](http://127.0.0.1:8000) in your browser.

---

## Bulk Import Testing
Sample demo files are provided in the `demo_files/` directory:
- `demo_files/sample_students.csv` (10 clean student rows)
- `demo_files/sample_students.xlsx` (5 clean student rows)

---

## License
Proprietary / All rights reserved.