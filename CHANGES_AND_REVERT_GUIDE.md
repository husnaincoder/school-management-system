# Project Changes & Reversion Guide

This document lists **every file and setting changed or created** in this project, along with exact step-by-step instructions to revert each change if you need to submit or return the project to its original state.

---

## ⚠️ Clarification on Security & Email Verification

> **Important Note:** The email verification security feature was **NOT disabled or removed from the codebase**.
>
> - The [`app/Models/User.php`](file:///d:/School-Management-main/School-Management-main/app/Models/User.php) model still implements `MustVerifyEmail`.
> - The verification routes and middleware in [`routes/auth.php`](file:///d:/School-Management-main/School-Management-main/routes/auth.php) remain intact.
>
> **What was actually done:**
> 1. We added `'email_verified_at' => now()` to [`database/seeders/UserSeeder.php`](file:///d:/School-Management-main/School-Management-main/database/seeders/UserSeeder.php) so that default pre-seeded testing accounts (e.g., `superadmin@school.com`, `admin@school.com`) are generated in an already-verified state for local development.
> 2. Newly registered users will **still be required to verify their email**.

---

## Summary of All Modified Files

Only **4 code files** were modified:

| File Path | Purpose of Change |
| :--- | :--- |
| [`database/seeders/UserSeeder.php`](file:///d:/School-Management-main/School-Management-main/database/seeders/UserSeeder.php) | Pre-verifies seed test users so local testing isn't blocked by mail servers |
| [`database/migrations/2026_08_16_220100_add_carry_forward_to_student_ledgers_type.php`](file:///d:/School-Management-main/School-Management-main/database/migrations/2026_08_16_220100_add_carry_forward_to_student_ledgers_type.php) | Wraps MySQL-specific `MODIFY COLUMN` statement in a driver check |
| [`database/migrations/2026_08_17_003500_enhance_timetable_module_fields.php`](file:///d:/School-Management-main/School-Management-main/database/migrations/2026_08_17_003500_enhance_timetable_module_fields.php) | Wraps MySQL-specific `MODIFY` statement in a driver check |
| [`database/migrations/2026_08_17_232000_move_class_incharges_to_class_section.php`](file:///d:/School-Management-main/School-Management-main/database/migrations/2026_08_17_232000_move_class_incharges_to_class_section.php) | Adds SQLite compatibility to `indexExists()` check |

---

## Detailed Diffs & How to Revert Each File

### 1. `database/seeders/UserSeeder.php`

#### What was changed:
Added `'email_verified_at' => now(),` to the 5 `User::firstOrCreate` calls.

#### How to Revert:
Remove the line `'email_verified_at' => now(),` from the 5 user creation blocks.

```diff
--- a/database/seeders/UserSeeder.php
+++ b/database/seeders/UserSeeder.php
@@ -28,3 +27,0 @@
-                'email_verified_at' => now(),
@@ -42,3 +38,0 @@
-                'email_verified_at' => now(),
@@ -56,3 +49,0 @@
-                'email_verified_at' => now(),
@@ -75,3 +65,0 @@
-                    'email_verified_at' => now(),
@@ -97,3 +84,0 @@
-                    'email_verified_at' => now(),
```

To unverify all current users in the database right now via terminal:
```bash
php artisan tinker --execute="App\Models\User::query()->update(['email_verified_at' => null]);"
```

---

### 2. `database/migrations/2026_08_16_220100_add_carry_forward_to_student_ledgers_type.php`

#### What was changed:
Wrapped raw MySQL `ALTER TABLE` in `if (DB::getDriverName() === 'mysql')` so SQLite doesn't crash on MySQL-specific ENUM alter syntax.

#### How to Revert:
```diff
--- a/database/migrations/2026_08_16_220100_add_carry_forward_to_student_ledgers_type.php
+++ b/database/migrations/2026_08_16_220100_add_carry_forward_to_student_ledgers_type.php
@@ -8,9 +8,7 @@
     public function up(): void
     {
-        if (DB::getDriverName() === 'mysql') {
-            DB::statement("ALTER TABLE student_ledgers MODIFY COLUMN type ENUM('invoice', 'payment', 'fine', 'refund', 'discount', 'carry_forward') NOT NULL");
-        }
+        DB::statement("ALTER TABLE student_ledgers MODIFY COLUMN type ENUM('invoice', 'payment', 'fine', 'refund', 'discount', 'carry_forward') NOT NULL");
     }

     public function down(): void
     {
-        if (DB::getDriverName() === 'mysql') {
-            DB::statement("ALTER TABLE student_ledgers MODIFY COLUMN type ENUM('invoice', 'payment', 'fine', 'refund', 'discount') NOT NULL");
-        }
+        DB::statement("ALTER TABLE student_ledgers MODIFY COLUMN type ENUM('invoice', 'payment', 'fine', 'refund', 'discount') NOT NULL");
     }
```

---

### 3. `database/migrations/2026_08_17_003500_enhance_timetable_module_fields.php`

#### What was changed:
Wrapped raw MySQL `ALTER TABLE` statement in `if (DB::getDriverName() === 'mysql')`.

#### How to Revert:
```diff
--- a/database/migrations/2026_08_17_003500_enhance_timetable_module_fields.php
+++ b/database/migrations/2026_08_17_003500_enhance_timetable_module_fields.php
@@ -45,5 +45,3 @@
         Schema::table('teacher_availabilties', function (Blueprint $table) {
             $table->dropForeign(['class_room_id']);
         });
-        if (DB::getDriverName() === 'mysql') {
-            DB::statement('ALTER TABLE teacher_availabilties MODIFY class_room_id BIGINT UNSIGNED NULL');
-        }
+        DB::statement('ALTER TABLE teacher_availabilties MODIFY class_room_id BIGINT UNSIGNED NULL');
         Schema::table('teacher_availabilties', function (Blueprint $table) {
```

---

### 4. `database/migrations/2026_08_17_232000_move_class_incharges_to_class_section.php`

#### What was changed:
Added SQLite support to `indexExists()` method.

#### How to Revert:
```diff
--- a/database/migrations/2026_08_17_232000_move_class_incharges_to_class_section.php
+++ b/database/migrations/2026_08_17_232000_move_class_incharges_to_class_section.php
@@ -214,7 +214,0 @@
-        if ($driver === 'sqlite') {
-            $row = DB::selectOne(
-                "SELECT 1 AS ok FROM sqlite_master WHERE type='index' AND name = ? LIMIT 1",
-                [$indexName]
-            );
-            return (bool) $row;
-        }
```

---

## 🔑 Automated Password Generation for Student & Parent Portals

### Feature Overview
When an administrator creates a new student (and/or parent), the system now **automatically generates secure, distinct login passwords** for both the Student Portal and Parent Portal without requiring manual input. The generated credentials are then securely flashed to the admin and displayed in a dedicated copyable credentials card.

### Modified Files for This Feature:

| File Path | Purpose of Change |
| :--- | :--- |
| [`app/Http/Controllers/Dashboard/Admin/StudentController.php`](file:///d:/School-Management-main/School-Management-main/app/Http/Controllers/Dashboard/Admin/StudentController.php) | Made `password` nullable; auto-generates distinct student password (`std_...`); handles parent credentials and flashes both. |
| [`app/Http/Controllers/Dashboard/Admin/ParentController.php`](file:///d:/School-Management-main/School-Management-main/app/Http/Controllers/Dashboard/Admin/ParentController.php) | Made `password` nullable in `createParent`; auto-generates distinct parent password (`prn_...`); returns it from `storeQuick` and `store`. |
| [`app/Http/Middleware/HandleInertiaRequests.php`](file:///d:/School-Management-main/School-Management-main/app/Http/Middleware/HandleInertiaRequests.php) | Added `'credentials'` to Inertia flash props sharing. |
| [`resources/js/Pages/dashboard/admin/StudentCreate.jsx`](file:///d:/School-Management-main/School-Management-main/resources/js/Pages/dashboard/admin/StudentCreate.jsx) | Removed required manual password inputs; added auto-generation info; captures parent generated password from modal. |
| [`resources/js/Components/Dashboard/ParentQuickCreateModal.jsx`](file:///d:/School-Management-main/School-Management-main/resources/js/Components/Dashboard/ParentQuickCreateModal.jsx) | Removed required manual password inputs; added auto-generation info; passes generated password to caller. |
| [`resources/js/Pages/dashboard/admin/ParentCreate.jsx`](file:///d:/School-Management-main/School-Management-main/resources/js/Pages/dashboard/admin/ParentCreate.jsx) | Removed required manual password inputs; added auto-generation info. |
| [`resources/js/Pages/dashboard/admin/Students.jsx`](file:///d:/School-Management-main/School-Management-main/resources/js/Pages/dashboard/admin/Students.jsx) | Displays copyable credentials card with Student & Parent Portal logins when `flash.credentials` is present. |

---

### How to Revert Automated Passwords Back to Manual Input

If you wish to revert this feature and restore manual password inputs for student and parent creation:

#### 1. In `app/Http/Controllers/Dashboard/Admin/StudentController.php`:
Change line 92 back from `'nullable'` to `'required'`:
```diff
-            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
+            'password' => ['required', 'string', 'min:8', 'confirmed'],
```
And replace the password resolution with the submitted password:
```diff
-        $studentPassword = filled($validated['password'] ?? null)
-            ? $validated['password']
-            : 'std_' . Str::lower(Str::random(8));
-        ... Hash::make($studentPassword) ...
+        ... Hash::make($validated['password']) ...
```

#### 2. In `app/Http/Controllers/Dashboard/Admin/ParentController.php`:
Change line 77 back to required:
```diff
-            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
+            'password' => ['required', 'string', 'min:8', 'confirmed'],
```
And use `$validated['password']` directly in `Hash::make`.

#### 3. In `resources/js/Pages/dashboard/admin/StudentCreate.jsx` & `ParentCreate.jsx` & `ParentQuickCreateModal.jsx`:
Restore the two `<input type="password">` fields (`password` and `password_confirmation`) and remove the auto-generation note block.

#### 4. In `resources/js/Pages/dashboard/admin/Students.jsx`:
Remove the `{credentials && (...)}` block and the `copyCredentials` helper.

#### 5. Rebuild frontend bundle:
```bash
npm run build
```

---

## Files and Directories Created During Setup

If you need to send back only the source code without runtime files, you can delete the following created items:

1. **`.env`** (Environment config created from `.env.example` - usually excluded in git repos)
2. **`database/database.sqlite`** (SQLite database file created during local migration)
3. **`vendor/`** (Composer dependencies)
4. **`node_modules/`** (NPM dependencies)
5. **`public/build/`** (Vite compiled production bundle)
6. **`storage/logs/laravel.log`** (Application runtime logs)
7. **`CHANGES_AND_REVERT_GUIDE.md`** (This document)

---

## How Email Verification Works in Production

When deploying this project in production:
1. In `.env`, set a real mail server:
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.mailtrap.io # or your SMTP server
   MAIL_PORT=2525
   MAIL_USERNAME=your_username
   MAIL_PASSWORD=your_password
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS="no-reply@yourdomain.com"
   MAIL_FROM_NAME="${APP_NAME}"
   ```
2. Any user that registers or logs in without a verified email will receive an automated verification link via that SMTP server.
