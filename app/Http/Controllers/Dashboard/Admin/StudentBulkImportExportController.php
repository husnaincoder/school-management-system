<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\ClassSectionGroup;
use App\Models\ParentModel;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\SubjectGroup;
use App\Models\User;
use App\Services\Student\StudentRollNumberService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;
use ZipArchive;

class StudentBulkImportExportController extends Controller
{
    /**
     * Display the multi-step bulk import wizard page.
     */
    public function create()
    {
        $academicSessions = AcademicSession::orderBy('start_date', 'desc')->get(['id', 'name', 'is_active']);
        $classes = SchoolClass::orderBy('name')->get(['id', 'name', 'is_active']);
        $sections = Section::orderBy('name')->get(['id', 'name', 'is_active']);

        $classSectionGroups = ClassSectionGroup::with([
            'classSection.academicSession:id,name',
            'classSection.class:id,name',
            'classSection.section:id,name',
            'subjectGroup:id,name',
        ])
            ->get()
            ->map(fn (ClassSectionGroup $csg) => [
                'id' => $csg->id,
                'academic_session_id' => $csg->classSection?->academic_session_id,
                'class_id' => $csg->classSection?->class_id,
                'section_id' => $csg->classSection?->section_id,
                'session_name' => $csg->classSection?->academicSession?->name ?? '—',
                'class_name' => $csg->classSection?->class?->name ?? '—',
                'section_name' => $csg->classSection?->section?->name ?? '—',
                'subject_group_name' => $csg->subjectGroup?->name ?? '—',
                'label' => sprintf(
                    '%s · %s · %s%s',
                    $csg->classSection?->academicSession?->name ?? 'Default Session',
                    $csg->classSection?->class?->name ?? 'Class',
                    $csg->classSection?->section?->name ?? 'Section',
                    $csg->subjectGroup ? ' (' . $csg->subjectGroup->name . ')' : ''
                ),
            ]);

        return inertia('dashboard/admin/StudentBulkImport', [
            'academicSessions' => $academicSessions,
            'classes' => $classes,
            'sections' => $sections,
            'classSectionGroups' => $classSectionGroups,
        ]);
    }

    /**
     * Download a standardized sample CSV template for student bulk import.
     */
    public function downloadTemplate(): StreamedResponse
    {
        $filename = 'student_import_template_' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return Response::streamDownload(function () {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel

            // CSV Column Headers
            fputcsv($out, [
                'Full Name',
                'First Name',
                'Last Name',
                'Email',
                'Phone',
                'CNIC',
                'Gender',
                'Date of Birth',
                'Address',
                'Parent Name',
                'Parent Phone',
                'Parent Email',
                'Sibling Discount',
            ]);

            // Sample Demo Rows
            fputcsv($out, [
                'Muhammad Ali',
                'Muhammad',
                'Ali',
                'ali.student@example.com',
                '03001234567',
                '3520112345671',
                'Male',
                '2015-05-14',
                'House 12, Street 4, Lahore',
                'Tariq Ali',
                '03009876543',
                'tariq.parent@example.com',
                'No',
            ]);

            fputcsv($out, [
                'Fatima Zahra',
                'Fatima',
                'Zahra',
                'fatima.student@example.com',
                '03121234567',
                '3520112345672',
                'Female',
                '2016-08-22',
                'Block B, Model Town, Lahore',
                'Zahoor Ahmed',
                '03219876543',
                'zahoor.parent@example.com',
                'Yes',
            ]);

            fputcsv($out, [
                'Hamza Usman',
                'Hamza',
                'Usman',
                '',
                '03331234567',
                '',
                'Male',
                '2015-11-03',
                'Gulberg III, Lahore',
                'Usman Khan',
                '03459876543',
                '',
                'No',
            ]);

            fclose($out);
        }, $filename, $headers);
    }

    /**
     * Parse an uploaded file (CSV, TSV, TXT, or XLSX) and extract headers & row data.
     */
    public function parseFile(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:10240'], // 10MB max
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();

        $rows = [];
        $headers = [];

        try {
            if (in_array($ext, ['csv', 'txt', 'tsv'])) {
                [$headers, $rows] = $this->parseCsvFile($path);
            } elseif (in_array($ext, ['xlsx', 'xls'])) {
                [$headers, $rows] = $this->parseExcelFile($path, $ext);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Unsupported file format. Please upload a .csv, .tsv, or .xlsx file.',
                ], 422);
            }
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse file: ' . $e->getMessage(),
            ], 422);
        }

        if (empty($headers) || empty($rows)) {
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file contains no readable data or headers.',
            ], 422);
        }

        // Limit maximum preview/import batch to 2000 rows for memory safety
        $totalFound = count($rows);
        if ($totalFound > 2000) {
            $rows = array_slice($rows, 0, 2000);
        }

        // Auto-generate suggested mapping based on common column name variations
        $suggestedMapping = $this->autoSuggestMapping($headers);

        return response()->json([
            'success' => true,
            'filename' => $file->getClientOriginalName(),
            'total_rows' => $totalFound,
            'loaded_rows' => count($rows),
            'headers' => $headers,
            'rows' => $rows,
            'suggested_mapping' => $suggestedMapping,
            'system_fields' => $this->getSystemFields(),
        ]);
    }

    /**
     * Validate the mapped rows against system and database rules without saving.
     */
    public function validateRows(Request $request)
    {
        $validated = $request->validate([
            'rows' => ['required', 'array'],
            'mapping' => ['required', 'array'],
            'class_section_group_id' => ['nullable', 'exists:class_section_groups,id'],
        ]);

        $rows = $validated['rows'];
        $mapping = $validated['mapping'];

        $validatedRows = [];
        $validCount = 0;
        $errorCount = 0;

        // Collect all emails and CNICs from the batch to test intra-file duplicates
        $batchEmails = [];
        $batchCnics = [];

        foreach ($rows as $index => $row) {
            $email = $this->getMappedValue($row, $mapping, 'email');
            $cnic = $this->getMappedValue($row, $mapping, 'cnic');

            if ($email) {
                $batchEmails[strtolower($email)][] = $index;
            }
            if ($cnic) {
                $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);
                $batchCnics[$cleanCnic][] = $index;
            }
        }

        // Cache existing DB records in memory to avoid N+1 queries during validation
        $existingEmails = [];
        $nonEmptyEmails = array_filter(array_keys($batchEmails));
        if (!empty($nonEmptyEmails)) {
            $existingEmails = User::whereIn('email', $nonEmptyEmails)->pluck('email')->map(fn ($e) => strtolower($e))->toArray();
        }

        $existingCnics = [];
        $nonEmptyCnics = array_filter(array_keys($batchCnics));
        if (!empty($nonEmptyCnics)) {
            $existingCnics = Student::withTrashed()->whereIn('cnic', $nonEmptyCnics)->pluck('cnic')->toArray();
        }

        foreach ($rows as $index => $row) {
            $errors = [];

            // 1. Student Name validation (required)
            $name = $this->getMappedValue($row, $mapping, 'name');
            $firstName = $this->getMappedValue($row, $mapping, 'first_name');
            $lastName = $this->getMappedValue($row, $mapping, 'last_name');

            $resolvedName = trim($name ?: ($firstName . ' ' . $lastName));
            if (empty($resolvedName)) {
                $errors['name'] = 'Student Name is required.';
            }

            // 2. Email validation (optional, but if present must be valid & unique)
            $email = $this->getMappedValue($row, $mapping, 'email');
            if ($email) {
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors['email'] = 'Invalid email format.';
                } elseif (in_array(strtolower($email), $existingEmails, true)) {
                    $errors['email'] = 'Email already registered in system.';
                } elseif (count($batchEmails[strtolower($email)] ?? []) > 1) {
                    $errors['email'] = 'Duplicate email found within this import file.';
                }
            }

            // 3. CNIC validation (optional, but if present must be unique & valid)
            $cnic = $this->getMappedValue($row, $mapping, 'cnic');
            if ($cnic) {
                $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);
                if (strlen($cnic) > 15) {
                    $errors['cnic'] = 'CNIC / B-Form cannot exceed 15 characters.';
                } elseif (in_array($cleanCnic, $existingCnics, true) || in_array($cnic, $existingCnics, true)) {
                    $errors['cnic'] = 'CNIC already exists in system (including soft-deleted records).';
                } elseif (count($batchCnics[$cleanCnic] ?? []) > 1) {
                    $errors['cnic'] = 'Duplicate CNIC found within this import file.';
                }
            }

            // 4. Gender validation (optional, normalize to male, female, other)
            $gender = $this->getMappedValue($row, $mapping, 'gender');
            if ($gender) {
                $normalizedGender = strtolower(trim($gender));
                if (in_array($normalizedGender, ['m', 'male', 'boy'])) {
                    $gender = 'male';
                } elseif (in_array($normalizedGender, ['f', 'female', 'girl'])) {
                    $gender = 'female';
                } elseif (in_array($normalizedGender, ['other', 'o'])) {
                    $gender = 'other';
                } else {
                    $errors['gender'] = 'Gender must be Male, Female, or Other.';
                }
            }

            // 5. Date of Birth validation (optional)
            $dob = $this->getMappedValue($row, $mapping, 'date_of_birth');
            if ($dob) {
                try {
                    $parsedDate = Carbon::parse($dob);
                    if ($parsedDate->isFuture()) {
                        $errors['date_of_birth'] = 'Date of birth cannot be in the future.';
                    } elseif ($parsedDate->year < 1990) {
                        $errors['date_of_birth'] = 'Date of birth is unusually early (prior to 1990).';
                    }
                } catch (Throwable) {
                    $errors['date_of_birth'] = 'Invalid date format (use YYYY-MM-DD or DD/MM/YYYY).';
                }
            }

            // 6. Phone validation
            $phone = $this->getMappedValue($row, $mapping, 'phone');
            if ($phone && strlen($phone) > 25) {
                $errors['phone'] = 'Phone number cannot exceed 25 characters.';
            }

            $isValid = empty($errors);
            if ($isValid) {
                $validCount++;
            } else {
                $errorCount++;
            }

            $validatedRows[] = [
                'index' => $index,
                'raw_data' => $row,
                'resolved' => [
                    'name' => $resolvedName,
                    'first_name' => $firstName ?: null,
                    'last_name' => $lastName ?: null,
                    'email' => $email ?: null,
                    'phone' => $phone ?: null,
                    'cnic' => $cnic ?: null,
                    'gender' => $gender ?: null,
                    'date_of_birth' => $dob ?: null,
                    'address' => $this->getMappedValue($row, $mapping, 'address') ?: null,
                    'parent_name' => $this->getMappedValue($row, $mapping, 'parent_name') ?: null,
                    'parent_phone' => $this->getMappedValue($row, $mapping, 'parent_phone') ?: null,
                    'parent_email' => $this->getMappedValue($row, $mapping, 'parent_email') ?: null,
                    'sibling_discount_eligible' => $this->parseBoolean($this->getMappedValue($row, $mapping, 'sibling_discount_eligible')),
                ],
                'is_valid' => $isValid,
                'errors' => $errors,
            ];
        }

        $totalRows = count($rows);
        $readinessScore = $totalRows > 0 ? (int) round(($validCount / $totalRows) * 100) : 0;

        return response()->json([
            'success' => true,
            'total_rows' => $totalRows,
            'valid_count' => $validCount,
            'error_count' => $errorCount,
            'readiness_score' => $readinessScore,
            'validated_rows' => $validatedRows,
        ]);
    }

    /**
     * Execute the atomic bulk import of validated records into the database.
     */
    public function executeImport(Request $request)
    {
        $request->validate([
            'class_section_group_id' => ['nullable'],
            'academic_session_id' => ['nullable'],
            'class_id' => ['nullable'],
            'section_id' => ['nullable'],
            'rows' => ['required', 'array', 'min:1'],
            'admission_date' => ['nullable', 'date'],
        ]);

        $classSectionGroup = $this->resolveClassSectionGroup($request);
        $classSectionGroupId = $classSectionGroup->id;
        $admissionDate = $request->input('admission_date') ?: now()->toDateString();
        $rows = $request->input('rows');

        $importedRecords = [];
        $skippedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($rows as $item) {
                // If the row is flagged as invalid or excluded, skip it safely
                if (isset($item['is_valid']) && !$item['is_valid']) {
                    $skippedCount++;
                    continue;
                }

                $data = $item['resolved'] ?? $item;

                $name = trim($data['name'] ?? '');
                if (empty($name)) {
                    $skippedCount++;
                    continue;
                }

                // 1. Calculate next collision-free student number and roll number
                $studentNumber = StudentRollNumberService::nextForGroup($classSectionGroup);

                // 2. Generate secure auto-password for student portal
                $studentPassword = 'std_' . Str::lower(Str::random(8));

                // 3. Create User account for student
                $user = User::create([
                    'name' => $name,
                    'id_card_number' => $studentNumber,
                    'email' => filled($data['email'] ?? null) ? strtolower(trim($data['email'])) : null,
                    'phone' => filled($data['phone'] ?? null) ? trim($data['phone']) : null,
                    'password' => Hash::make($studentPassword),
                    'is_active' => true,
                    'email_verified_at' => filled($data['email'] ?? null) ? now() : null,
                ]);
                $user->assignRole('student');

                // 4. Handle Parent Association (if parent name/phone provided)
                $parentId = null;
                $parentName = trim($data['parent_name'] ?? '');
                $parentPhone = trim($data['parent_phone'] ?? '');
                $parentEmail = trim($data['parent_email'] ?? '');

                if (!empty($parentName) || !empty($parentPhone)) {
                    $parentUser = null;
                    if (!empty($parentPhone)) {
                        $parentUser = User::where('phone', $parentPhone)->role('parent')->first();
                    }
                    if (!$parentUser && !empty($parentEmail)) {
                        $parentUser = User::where('email', $parentEmail)->role('parent')->first();
                    }

                    if (!$parentUser) {
                        $parentGeneratedPassword = 'prn_' . Str::lower(Str::random(8));
                        $parentNumber = 'PRN' . str_pad((string) ((User::max('id') ?? 0) + 1), 4, '0', STR_PAD_LEFT);

                        $parentUser = User::create([
                            'name' => $parentName ?: 'Guardian of ' . $name,
                            'id_card_number' => $parentNumber,
                            'email' => !empty($parentEmail) ? strtolower($parentEmail) : null,
                            'phone' => !empty($parentPhone) ? $parentPhone : null,
                            'password' => Hash::make($parentGeneratedPassword),
                            'is_active' => true,
                        ]);
                        $parentUser->assignRole('parent');

                        $parentModel = ParentModel::create([
                            'user_id' => $parentUser->id,
                            'relation_with_student' => 'Father',
                            'is_active' => true,
                        ]);
                        $parentId = $parentModel->id;
                    } else {
                        $parentModel = ParentModel::firstOrCreate(['user_id' => $parentUser->id], [
                            'relation_with_student' => 'Parent',
                            'is_active' => true,
                        ]);
                        $parentId = $parentModel->id;
                    }
                }

                // 5. Create Student profile entity
                $dateOfBirth = null;
                if (!empty($data['date_of_birth'])) {
                    try {
                        $dateOfBirth = Carbon::parse($data['date_of_birth'])->format('Y-m-d');
                    } catch (Throwable) {
                        $dateOfBirth = null;
                    }
                }

                $student = Student::create([
                    'user_id' => $user->id,
                    'parent_id' => $parentId,
                    'sibling_discount_eligible' => (bool) ($data['sibling_discount_eligible'] ?? false),
                    'first_name' => filled($data['first_name'] ?? null) ? trim($data['first_name']) : null,
                    'last_name' => filled($data['last_name'] ?? null) ? trim($data['last_name']) : null,
                    'cnic' => filled($data['cnic'] ?? null) ? trim($data['cnic']) : null,
                    'admission_number' => $studentNumber,
                    'date_of_birth' => $dateOfBirth,
                    'gender' => filled($data['gender'] ?? null) ? strtolower(trim($data['gender'])) : null,
                    'address' => filled($data['address'] ?? null) ? trim($data['address']) : null,
                ]);

                // 6. Create Student Enrollment in target group
                StudentEnrollment::create([
                    'student_id' => $student->id,
                    'class_section_group_id' => $classSectionGroupId,
                    'roll_number' => $studentNumber,
                    'admission_date' => $admissionDate,
                    'status' => 'active',
                ]);

                $importedRecords[] = [
                    'student_id' => $student->id,
                    'name' => $user->name,
                    'roll_number' => $studentNumber,
                    'login_id' => $user->id_card_number,
                    'email' => $user->email,
                    'password' => $studentPassword,
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => sprintf('Successfully imported %d student records.', count($importedRecords)),
                'imported_count' => count($importedRecords),
                'skipped_count' => $skippedCount,
                'credentials' => $importedRecords,
                'target_group' => [
                    'session' => $classSectionGroup->classSection?->academicSession?->name ?? '—',
                    'class' => $classSectionGroup->classSection?->class?->name ?? '—',
                    'section' => $classSectionGroup->classSection?->section?->name ?? '—',
                ],
            ]);
        } catch (Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Import transaction aborted due to database error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Companion Export: Download students based on selected Session, Class, Section, and Search filters.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Student::with([
            'user',
            'parent.user',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
        ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_number', 'like', "%{$search}%")
                    ->orWhere('cnic', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('id_card_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('academic_session_id')) {
            $sessionId = $request->input('academic_session_id');
            $query->whereHas('enrollment.classSectionGroup.classSection', fn ($cs) => $cs->where('academic_session_id', $sessionId));
        }

        if ($request->filled('class_id')) {
            $classId = $request->input('class_id');
            $query->whereHas('enrollment.classSectionGroup.classSection', fn ($cs) => $cs->where('class_id', $classId));
        }

        if ($request->filled('section_id')) {
            $sectionId = $request->input('section_id');
            $query->whereHas('enrollment.classSectionGroup.classSection', fn ($cs) => $cs->where('section_id', $sectionId));
        }

        $students = $query->orderBy('admission_number')->orderBy('id')->get();

        $filename = 'students_export_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return Response::streamDownload(function () use ($students) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM

            fputcsv($out, [
                'Admission / Roll No',
                'Full Name',
                'Email',
                'Phone',
                'CNIC',
                'Gender',
                'Date of Birth',
                'Session',
                'Class',
                'Section',
                'Parent Name',
                'Parent Phone',
                'Sibling Discount',
                'Status',
            ]);

            foreach ($students as $student) {
                $user = $student->user;
                $parentUser = $student->parent?->user;
                $enrollment = $student->enrollment;
                $cs = $enrollment?->classSectionGroup?->classSection;

                fputcsv($out, [
                    $student->admission_number ?? ($enrollment->roll_number ?? '—'),
                    $student->first_name && $student->last_name ? "{$student->first_name} {$student->last_name}" : ($user->name ?? '—'),
                    $user->email ?? '—',
                    $user->phone ?? '—',
                    $student->cnic ?? '—',
                    ucfirst($student->gender ?? '—'),
                    $student->date_of_birth ? $student->date_of_birth->format('Y-m-d') : '—',
                    $cs?->academicSession?->name ?? '—',
                    $cs?->class?->name ?? '—',
                    $cs?->section?->name ?? '—',
                    $parentUser->name ?? '—',
                    $parentUser->phone ?? '—',
                    $student->sibling_discount_eligible ? 'Yes' : 'No',
                    ucfirst($enrollment->status ?? 'Active'),
                ]);
            }

            fclose($out);
        }, $filename, $headers);
    }

    /**
     * Parse raw CSV/TSV data into headers and array of row dictionaries.
     */
    protected function parseCsvFile(string $path): array
    {
        $content = file_get_contents($path);
        // Strip UTF-8 BOM if present
        $bom = pack('H*', 'EFBBBF');
        $content = preg_replace("/^$bom/", '', $content);

        // Detect delimiter (comma, tab, semicolon)
        $firstLine = strtok($content, "\r\n");
        $delimiter = ',';
        $commaCount = substr_count($firstLine, ',');
        $tabCount = substr_count($firstLine, "\t");
        $semiCount = substr_count($firstLine, ';');

        if ($tabCount > $commaCount && $tabCount > $semiCount) {
            $delimiter = "\t";
        } elseif ($semiCount > $commaCount && $semiCount > $tabCount) {
            $delimiter = ';';
        }

        $handle = fopen('php://memory', 'r+');
        fwrite($handle, $content);
        rewind($handle);

        $headers = [];
        $rows = [];

        if (($firstRow = fgetcsv($handle, 0, $delimiter)) !== false) {
            $headers = array_map(function ($h) {
                return trim(strip_tags((string) $h));
            }, $firstRow);
        }

        $rowIndex = 0;
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false && $rowIndex < 2500) {
            // Skip empty rows
            if (empty(array_filter($data, fn ($val) => trim((string) $val) !== ''))) {
                continue;
            }

            $row = [];
            foreach ($headers as $colIdx => $colName) {
                $val = $data[$colIdx] ?? '';
                $row[$colName] = trim(strip_tags((string) $val));
            }
            $rows[] = $row;
            $rowIndex++;
        }

        fclose($handle);

        return [$headers, $rows];
    }

    /**
     * Native Excel XML extraction for .xlsx files using PHP ZipArchive.
     */
    protected function parseExcelFile(string $path, string $ext): array
    {
        if ($ext === 'xls') {
            // For legacy binary .xls, attempt reading if tab/csv content or throw clear hint
            return $this->parseCsvFile($path);
        }

        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \Exception('Could not extract .xlsx archive.');
        }

        // 1. Read shared strings
        $sharedStrings = [];
        $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedStringsXml !== false) {
            $xml = @simplexml_load_string($sharedStringsXml);
            if ($xml && isset($xml->si)) {
                foreach ($xml->si as $si) {
                    $sharedStrings[] = (string) ($si->t ?? ($si->r->t ?? ''));
                }
            }
        }

        // 2. Read first worksheet
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw new \Exception('Worksheet sheet1.xml not found in .xlsx workbook.');
        }

        $xml = @simplexml_load_string($sheetXml);
        if (!$xml || !isset($xml->sheetData->row)) {
            throw new \Exception('Invalid or empty worksheet structure.');
        }

        $parsedRows = [];
        foreach ($xml->sheetData->row as $rowNode) {
            $rowCells = [];
            foreach ($rowNode->c as $cell) {
                $attr = $cell->attributes();
                $type = (string) ($attr['t'] ?? '');
                $val = (string) $cell->v;

                if ($type === 's') {
                    $strIndex = (int) $val;
                    $cellValue = $sharedStrings[$strIndex] ?? '';
                } else {
                    $cellValue = $val;
                }

                $rowCells[] = trim(strip_tags($cellValue));
            }
            if (!empty(array_filter($rowCells, fn ($c) => $c !== ''))) {
                $parsedRows[] = $rowCells;
            }
        }

        if (empty($parsedRows)) {
            return [[], []];
        }

        $headers = array_shift($parsedRows);
        $headers = array_map('trim', $headers);

        $rows = [];
        foreach ($parsedRows as $data) {
            $row = [];
            foreach ($headers as $colIdx => $colName) {
                $val = $data[$colIdx] ?? '';
                $row[$colName] = (string) $val;
            }
            $rows[] = $row;
        }

        return [$headers, $rows];
    }

    /**
     * Map detected headers to system database fields automatically.
     */
    protected function autoSuggestMapping(array $headers): array
    {
        $mapping = [];

        $rules = [
            'name' => ['full name', 'student name', 'name', 'student'],
            'first_name' => ['first name', 'fname', 'first'],
            'last_name' => ['last name', 'lname', 'surname', 'last'],
            'email' => ['email', 'email address', 'student email', 'mail'],
            'phone' => ['phone', 'mobile', 'cell', 'student mobile', 'student phone', 'contact'],
            'cnic' => ['cnic', 'b form', 'bform', 'national id', 'id card', 'form b'],
            'gender' => ['gender', 'sex'],
            'date_of_birth' => ['date of birth', 'dob', 'birth date', 'birthdate'],
            'address' => ['address', 'residential address', 'street address', 'home address', 'city'],
            'parent_name' => ['parent name', 'father name', 'guardian name', 'father', 'parent', 'guardian'],
            'parent_phone' => ['parent phone', 'father phone', 'guardian phone', 'father mobile', 'parent mobile'],
            'parent_email' => ['parent email', 'father email', 'guardian email'],
            'sibling_discount_eligible' => ['sibling discount', 'sibling', 'discount eligible'],
        ];

        foreach ($headers as $header) {
            $cleanHeader = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', ' ', $header)));

            foreach ($rules as $systemField => $aliases) {
                if (isset($mapping[$systemField])) {
                    continue;
                }

                foreach ($aliases as $alias) {
                    if ($cleanHeader === $alias || str_starts_with($cleanHeader, $alias) || str_ends_with($cleanHeader, $alias)) {
                        $mapping[$systemField] = $header;
                        break;
                    }
                }
            }
        }

        return $mapping;
    }

    /**
     * Helper to retrieve value from row dictionary given field mapping.
     */
    protected function getMappedValue(array $row, array $mapping, string $systemField): ?string
    {
        $headerName = $mapping[$systemField] ?? null;
        if (!$headerName || !isset($row[$headerName])) {
            return null;
        }

        $val = trim((string) $row[$headerName]);
        return $val !== '' ? $val : null;
    }

    /**
     * Parse flexible boolean values (yes/no, true/false, 1/0, y/n).
     */
    protected function parseBoolean(?string $val): bool
    {
        if ($val === null) {
            return false;
        }
        $val = strtolower(trim($val));
        return in_array($val, ['1', 'true', 'yes', 'y', 'on'], true);
    }

    /**
     * System fields definition for frontend mapper.
     */
    protected function getSystemFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Student Full Name', 'required' => true, 'description' => 'Full name of the student'],
            ['key' => 'first_name', 'label' => 'First Name', 'required' => false, 'description' => 'Optional first name'],
            ['key' => 'last_name', 'label' => 'Last Name', 'required' => false, 'description' => 'Optional last name'],
            ['key' => 'email', 'label' => 'Student Email', 'required' => false, 'description' => 'Unique email for student portal login'],
            ['key' => 'phone', 'label' => 'Student Mobile / Phone', 'required' => false, 'description' => 'Contact number'],
            ['key' => 'cnic', 'label' => 'Student CNIC / B-Form', 'required' => false, 'description' => 'National ID or Form-B number'],
            ['key' => 'gender', 'label' => 'Gender', 'required' => false, 'description' => 'Male, Female, or Other'],
            ['key' => 'date_of_birth', 'label' => 'Date of Birth', 'required' => false, 'description' => 'Birthdate (YYYY-MM-DD or DD/MM/YYYY)'],
            ['key' => 'address', 'label' => 'Home Address', 'required' => false, 'description' => 'Residential address'],
            ['key' => 'parent_name', 'label' => 'Parent / Guardian Name', 'required' => false, 'description' => 'Father or guardian name'],
            ['key' => 'parent_phone', 'label' => 'Parent Phone / Mobile', 'required' => false, 'description' => 'Parent contact number for portal access'],
            ['key' => 'parent_email', 'label' => 'Parent Email', 'required' => false, 'description' => 'Parent email address'],
            ['key' => 'sibling_discount_eligible', 'label' => 'Sibling Discount Eligible', 'required' => false, 'description' => 'Yes/No or 1/0'],
        ];
    }

    /**
     * Resolve or dynamically auto-provision the ClassSection and ClassSectionGroup.
     */
    protected function resolveClassSectionGroup(Request $request): ClassSectionGroup
    {
        $groupId = $request->input('class_section_group_id');
        if ($groupId && $groupId !== 'auto' && is_numeric($groupId)) {
            $existing = ClassSectionGroup::with([
                'classSection.academicSession',
                'classSection.class',
                'classSection.section',
                'subjectGroup',
            ])->find((int) $groupId);

            if ($existing) {
                return $existing;
            }
        }

        $sessionId = $request->input('academic_session_id')
            ?: AcademicSession::where('is_active', true)->value('id')
            ?: AcademicSession::value('id');

        $classId = $request->input('class_id') ?: SchoolClass::value('id');
        $sectionId = $request->input('section_id') ?: Section::value('id');

        $classSection = ClassSection::firstOrCreate([
            'academic_session_id' => $sessionId,
            'class_id' => $classId,
            'section_id' => $sectionId,
        ], [
            'capacity' => 40,
            'is_active' => true,
        ]);

        $defaultSubjectGroup = SubjectGroup::first();
        $subjectGroupId = $defaultSubjectGroup?->id ?: 1;

        return ClassSectionGroup::firstOrCreate([
            'class_section_id' => $classSection->id,
            'subject_group_id' => $subjectGroupId,
        ]);
    }
}
