import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUpload,
    faDownload,
    faFileCsv,
    faFileExcel,
    faCheck,
    faExclamationTriangle,
    faCircleCheck,
    faCircleExclamation,
    faArrowLeft,
    faArrowRight,
    faCopy,
    faRotateRight,
    faCircleNotch,
    faUserGraduate,
    faXmark,
    faPen,
} from '@fortawesome/free-solid-svg-icons';

export default function StudentBulkImport({
    academicSessions = [],
    classes = [],
    sections = [],
    classSectionGroups = [],
}) {
    // Current wizard step: 1 (Upload & Target), 2 (Mapping & Health), 3 (Results)
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1 State: Destination Context & File
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [parsingFile, setParsingFile] = useState(false);
    const [parseError, setParseError] = useState('');
    const fileInputRef = useRef(null);

    // Step 2 State: Mapping & Verification
    const [fileHeaders, setFileHeaders] = useState([]);
    const [rawRows, setRawRows] = useState([]);
    const [systemFields, setSystemFields] = useState([]);
    const [mapping, setMapping] = useState({});
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [rowFilter, setRowFilter] = useState('all'); // 'all' | 'ready' | 'errors'

    // Inline Editing Modal State
    const [editingRowIndex, setEditingRowIndex] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Step 3 State: Import Execution & Credentials
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Auto-select initial academic context
    useEffect(() => {
        if (!selectedSession && academicSessions.length > 0) {
            const activeSession = academicSessions.find((s) => s.is_active) || academicSessions[0];
            setSelectedSession(String(activeSession.id));
        }
    }, [academicSessions]);

    // Available groups filtered by session / class / section
    const filteredGroups = useMemo(() => {
        return classSectionGroups.filter((g) => {
            if (selectedSession && String(g.academic_session_id) !== String(selectedSession)) return false;
            if (selectedClass && String(g.class_id) !== String(selectedClass)) return false;
            if (selectedSection && String(g.section_id) !== String(selectedSection)) return false;
            return true;
        });
    }, [classSectionGroups, selectedSession, selectedClass, selectedSection]);

    // Auto-select class section group if available, or set to 'auto' so it auto-creates upon import
    useEffect(() => {
        if (filteredGroups.length > 0) {
            if (!selectedGroupId || selectedGroupId === 'auto' || !filteredGroups.some((g) => String(g.id) === String(selectedGroupId))) {
                setSelectedGroupId(String(filteredGroups[0].id));
            }
        } else {
            setSelectedGroupId('auto');
        }
    }, [filteredGroups]);

    const handleGroupChange = (val) => {
        setSelectedGroupId(val);
        if (val && val !== 'auto') {
            const found = classSectionGroups.find((g) => String(g.id) === String(val));
            if (found) {
                if (found.academic_session_id) setSelectedSession(String(found.academic_session_id));
                if (found.class_id) setSelectedClass(String(found.class_id));
                if (found.section_id) setSelectedSection(String(found.section_id));
            }
        }
    };

    const canProceed = Boolean(
        file &&
        ((selectedGroupId && selectedGroupId !== 'auto') || (selectedClass && selectedSection)) &&
        !parsingFile
    );

    // Handle File Drop / Selection
    const handleFileSelected = (selectedFile) => {
        if (!selectedFile) return;
        const ext = selectedFile.name.split('.').pop().toLowerCase();
        if (!['csv', 'txt', 'tsv', 'xlsx', 'xls'].includes(ext)) {
            setParseError('Unsupported file type. Please upload a .csv, .tsv, or .xlsx file.');
            return;
        }
        setParseError('');
        setFile(selectedFile);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelected(e.dataTransfer.files[0]);
        }
    };

    // Step 1 -> Step 2: Upload and parse headers & rows on backend
    const proceedToMapping = async () => {
        if (!file) {
            setParseError('Please upload a file before continuing.');
            return;
        }
        if ((!selectedGroupId || selectedGroupId === 'auto') && (!selectedClass || !selectedSection)) {
            setParseError('Please select a Class and Section destination.');
            return;
        }

        setParsingFile(true);
        setParseError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await axios.post(route('academic.students.import.parse'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data.success) {
                setFileHeaders(data.headers);
                setRawRows(data.rows);
                setSystemFields(data.system_fields);
                setMapping(data.suggested_mapping || {});
                setCurrentStep(2);

                // Trigger immediate initial validation with the suggested mappings
                runValidation(data.rows, data.suggested_mapping || {}, selectedGroupId);
            } else {
                setParseError(data.message || 'Failed to parse file.');
            }
        } catch (err) {
            setParseError(err.response?.data?.message || 'Server error while parsing the file. Please check file formatting.');
        } finally {
            setParsingFile(false);
        }
    };

    // Run backend validation on rows and calculate readiness score
    const runValidation = async (rowsToValidate, currentMapping, groupId) => {
        setValidating(true);
        try {
            const { data } = await axios.post(route('academic.students.import.validate'), {
                rows: rowsToValidate,
                mapping: currentMapping,
                class_section_group_id: groupId !== 'auto' ? groupId : null,
                academic_session_id: selectedSession || null,
                class_id: selectedClass || null,
                section_id: selectedSection || null,
            });

            if (data.success) {
                setValidationResult(data);
            }
        } catch (err) {
            console.error('Validation failed:', err);
        } finally {
            setValidating(false);
        }
    };

    // Handle mapping change for a system field
    const handleMappingChange = (systemFieldKey, headerValue) => {
        const updated = { ...mapping };
        if (!headerValue) {
            delete updated[systemFieldKey];
        } else {
            updated[systemFieldKey] = headerValue;
        }
        setMapping(updated);
        runValidation(rawRows, updated, selectedGroupId);
    };

    // Filtered display of validated rows
    const displayedRows = useMemo(() => {
        if (!validationResult?.validated_rows) return [];
        if (rowFilter === 'ready') {
            return validationResult.validated_rows.filter((r) => r.is_valid);
        }
        if (rowFilter === 'errors') {
            return validationResult.validated_rows.filter((r) => !r.is_valid);
        }
        return validationResult.validated_rows;
    }, [validationResult, rowFilter]);

    // Open Inline Row Editor
    const openEditRow = (rowItem) => {
        setEditingRowIndex(rowItem.index);
        setEditFormData({ ...(rowItem.resolved || {}) });
    };

    // Save edited row and re-validate
    const saveRowEdit = () => {
        if (editingRowIndex === null) return;

        const updatedRawRows = [...rawRows];
        // Merge resolved edits back into the raw row under mapped keys
        const targetRow = { ...updatedRawRows[editingRowIndex] };
        Object.keys(editFormData).forEach((fieldKey) => {
            const mappedHeader = mapping[fieldKey];
            if (mappedHeader) {
                targetRow[mappedHeader] = editFormData[fieldKey] ?? '';
            }
        });

        updatedRawRows[editingRowIndex] = targetRow;
        setRawRows(updatedRawRows);
        setEditingRowIndex(null);

        // Re-run validation dynamically
        runValidation(updatedRawRows, mapping, selectedGroupId);
    };

    // Step 2 -> Step 3: Execute Batch Import
    const executeBatchImport = async () => {
        if (!validationResult || validationResult.valid_count === 0) return;

        setImporting(true);
        try {
            const { data } = await axios.post(route('academic.students.import.execute'), {
                class_section_group_id: selectedGroupId !== 'auto' ? selectedGroupId : null,
                academic_session_id: selectedSession || null,
                class_id: selectedClass || null,
                section_id: selectedSection || null,
                rows: validationResult.validated_rows,
                admission_date: new Date().toISOString().split('T')[0],
            });

            if (data.success) {
                setImportResult(data);
                setCurrentStep(3);
            } else {
                alert(data.message || 'Import failed.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Database error occurred during batch execution.');
        } finally {
            setImporting(false);
        }
    };

    // Copy all credentials to clipboard
    const copyAllCredentials = () => {
        if (!importResult?.credentials) return;
        let text = `=== BULK IMPORT STUDENT CREDENTIALS (${importResult.credentials.length} STUDENTS) ===\n\n`;
        importResult.credentials.forEach((c, idx) => {
            text += `${idx + 1}. Name: ${c.name}\n`;
            text += `   Login ID / Roll No: ${c.login_id}\n`;
            if (c.email) text += `   Email: ${c.email}\n`;
            text += `   Password: ${c.password}\n\n`;
        });
        navigator.clipboard.writeText(text);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 3000);
    };

    const copySingleCredential = (cred, idx) => {
        const text = `Name: ${cred.name}\nLogin ID: ${cred.login_id}\nPassword: ${cred.password}`;
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2500);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Bulk Import Students" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Breadcrumbs */}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Students', href: route('academic.students') },
                            { label: 'Bulk Import Wizard' },
                        ]}
                    />

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600 shadow-sm">
                                <FontAwesomeIcon icon={faUpload} className="text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Bulk Import Students</h1>
                                <p className="text-sm text-gray-500">
                                    Upload CSV or Excel files, map fields, verify data, and import safely.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={route('academic.students.import.template')}
                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
                            >
                                <FontAwesomeIcon icon={faDownload} className="text-amber-600" />
                                Download Sample Template
                            </a>
                            <Link
                                href={route('academic.students')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Back to Students
                            </Link>
                        </div>
                    </div>

                    {/* Step Wizard Progress Bar */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div
                                className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                                    currentStep === 1
                                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                                        : currentStep > 1
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        currentStep === 1
                                            ? 'bg-amber-500 text-white'
                                            : currentStep > 1
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {currentStep > 1 ? <FontAwesomeIcon icon={faCheck} /> : '1'}
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Step 1</div>
                                    <div className="text-sm font-semibold">Upload & Context Selection</div>
                                </div>
                            </div>

                            <div
                                className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                                    currentStep === 2
                                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                                        : currentStep > 2
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        currentStep === 2
                                            ? 'bg-amber-500 text-white'
                                            : currentStep > 2
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {currentStep > 2 ? <FontAwesomeIcon icon={faCheck} /> : '2'}
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Step 2</div>
                                    <div className="text-sm font-semibold">Column Mapping & Verification</div>
                                </div>
                            </div>

                            <div
                                className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                                    currentStep === 3
                                        ? 'bg-green-50 border-green-300 text-green-900 font-semibold'
                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        currentStep === 3
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    3
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">Step 3</div>
                                    <div className="text-sm font-semibold">Execution & Credentials</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* SCREEN 1: FILE UPLOAD & CONTEXT SELECTION                                   */}
                    {/* ========================================================================= */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            {parseError && (
                                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
                                    <FontAwesomeIcon icon={faCircleExclamation} className="text-red-500 mt-0.5 text-base" />
                                    <div>
                                        <div className="font-semibold">Upload Error</div>
                                        <div>{parseError}</div>
                                    </div>
                                </div>
                            )}

                            {/* Destination Selection Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500" />
                                    1. Select Target Academic Destination
                                </h2>
                                <p className="text-xs text-gray-500 mb-5">
                                    All students imported from this file will be enrolled into the chosen academic session, class, and section.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Session */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                                            Academic Session *
                                        </label>
                                        <select
                                            value={selectedSession}
                                            onChange={(e) => setSelectedSession(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        >
                                            <option value="">-- All Sessions --</option>
                                            {academicSessions.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} {s.is_active ? '(Active)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Class */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                                            Class *
                                        </label>
                                        <select
                                            value={selectedClass}
                                            onChange={(e) => setSelectedClass(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        >
                                            <option value="">-- All Classes --</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Section */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                                            Section *
                                        </label>
                                        <select
                                            value={selectedSection}
                                            onChange={(e) => setSelectedSection(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        >
                                            <option value="">-- All Sections --</option>
                                            {sections.map((sec) => (
                                                <option key={sec.id} value={sec.id}>
                                                    {sec.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Target Group */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                                            Class Section Group *
                                        </label>
                                        <select
                                            value={selectedGroupId}
                                            onChange={(e) => handleGroupChange(e.target.value)}
                                            className="w-full border border-amber-300 bg-amber-50/40 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                        >
                                            {filteredGroups.length === 0 ? (
                                                <option value="auto">
                                                    {selectedClass && selectedSection
                                                        ? '✨ Auto-create group for this class & section'
                                                        : 'Select Class & Section to auto-create'}
                                                </option>
                                            ) : (
                                                <>
                                                    {filteredGroups.map((g) => (
                                                        <option key={g.id} value={g.id}>
                                                            {g.label}
                                                        </option>
                                                    ))}
                                                    <option value="auto">✨ Auto-create new group</option>
                                                </>
                                            )}
                                        </select>
                                        {selectedGroupId === 'auto' && selectedClass && selectedSection && (
                                            <div className="text-[11px] text-emerald-700 font-medium mt-1">
                                                ✓ Group will be auto-created for this class & section
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* File Upload Zone Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUpload} className="text-amber-500" />
                                    2. Upload Student Data File
                                </h2>
                                <p className="text-xs text-gray-500 mb-5">
                                    Accepts standard comma-separated values (<code>.csv</code>) or Excel spreadsheets (<code>.xlsx</code>).
                                </p>

                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                                        isDragging
                                            ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
                                            : file
                                            ? 'border-green-400 bg-green-50/40'
                                            : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50/80'
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.txt,.tsv,.xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) => handleFileSelected(e.target.files?.[0])}
                                    />

                                    {file ? (
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl shadow-sm">
                                                <FontAwesomeIcon icon={file.name.endsWith('.xlsx') ? faFileExcel : faFileCsv} />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-gray-900">{file.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {(file.size / 1024).toFixed(1)} KB · Click or drop another file to replace
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                                <FontAwesomeIcon icon={faCircleCheck} /> File ready for mapping
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-2xl">
                                                <FontAwesomeIcon icon={faUpload} />
                                            </div>
                                            <div>
                                                <div className="text-base font-semibold text-gray-800">
                                                    Drag and drop your student file here, or{' '}
                                                    <span className="text-amber-600 underline font-bold">browse computer</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Supports .CSV, .XLSX, and .TSV files up to 10MB (up to 2,000 students per batch)
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                    <div className="text-xs text-gray-500">
                                        Need the exact structure? Download the{' '}
                                        <a
                                            href={route('academic.students.import.template')}
                                            className="text-amber-600 font-bold hover:underline"
                                        >
                                            sample CSV template
                                        </a>
                                        .
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!canProceed}
                                        onClick={proceedToMapping}
                                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-sm"
                                    >
                                        {parsingFile ? (
                                            <>
                                                <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                                                Reading File & Columns...
                                            </>
                                        ) : (
                                            <>
                                                Continue to Field Mapping
                                                <FontAwesomeIcon icon={faArrowRight} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SCREEN 2: DATA MAPPING & HEALTH INSPECTOR                                 */}
                    {/* ========================================================================= */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            {/* Health & Readiness Bar Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            Dataset Health & Readiness Score
                                        </div>
                                        <div className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                            <span>{validationResult?.readiness_score ?? 0}% Ready</span>
                                            {validationResult?.readiness_score === 100 ? (
                                                <span className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faCircleCheck} /> 100% Valid
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                    <FontAwesomeIcon icon={faExclamationTriangle} /> Review Needed
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => runValidation(rawRows, mapping, selectedGroupId)}
                                            disabled={validating}
                                            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                                        >
                                            <FontAwesomeIcon
                                                icon={faRotateRight}
                                                className={validating ? 'animate-spin' : ''}
                                            />
                                            {validating ? 'Checking...' : 'Re-check Rules'}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                !validationResult ||
                                                validationResult.valid_count === 0 ||
                                                importing
                                            }
                                            onClick={executeBatchImport}
                                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold text-sm transition shadow-sm"
                                        >
                                            {importing ? (
                                                <>
                                                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                                                    Importing Database Records...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faCheck} />
                                                    Import {validationResult?.valid_count ?? 0} Valid Records
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Track */}
                                <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 rounded-full ${
                                            (validationResult?.readiness_score ?? 0) >= 90
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                                : (validationResult?.readiness_score ?? 0) >= 60
                                                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                                : 'bg-gradient-to-r from-red-500 to-rose-600'
                                        }`}
                                        style={{ width: `${validationResult?.readiness_score ?? 0}%` }}
                                    />
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
                                        <span className="text-gray-500">Total Loaded:</span>{' '}
                                        <strong className="text-gray-900">{validationResult?.total_rows ?? rawRows.length}</strong>
                                    </div>
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                                        <span className="text-green-700">Valid & Ready:</span>{' '}
                                        <strong className="text-green-900">{validationResult?.valid_count ?? 0}</strong>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                                        <span className="text-red-700">Has Issues:</span>{' '}
                                        <strong className="text-red-900">{validationResult?.error_count ?? 0}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Column Mapping Section */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Column Mapping</h3>
                                        <p className="text-xs text-gray-500">
                                            Match each column in your file to the corresponding student profile field in the database.
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                                        <strong className="text-amber-800">Student Name</strong> is the only mandatory field. Passwords, Roll Numbers, and IDs are auto-generated.
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {systemFields.map((field) => {
                                        const mappedHeader = mapping[field.key] || '';
                                        return (
                                            <div
                                                key={field.key}
                                                className={`p-3.5 rounded-xl border transition ${
                                                    mappedHeader
                                                        ? 'bg-amber-50/30 border-amber-300'
                                                        : field.required
                                                        ? 'bg-red-50/40 border-red-300'
                                                        : 'bg-gray-50/50 border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                                        {field.label}
                                                        {field.required && (
                                                            <span className="text-red-600 font-black text-sm">*</span>
                                                        )}
                                                    </span>
                                                    {mappedHeader && (
                                                        <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                                                            Mapped
                                                        </span>
                                                    )}
                                                </div>
                                                <select
                                                    value={mappedHeader}
                                                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                                    className={`w-full text-xs rounded-lg px-2.5 py-2 bg-white ${
                                                        field.required && !mappedHeader
                                                            ? 'border-red-400 focus:ring-red-500'
                                                            : 'border-gray-300 focus:ring-amber-500'
                                                    }`}
                                                >
                                                    <option value="">-- Do Not Import --</option>
                                                    {fileHeaders.map((header) => (
                                                        <option key={header} value={header}>
                                                            File: "{header}"
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="text-[11px] text-gray-400 mt-1 truncate">
                                                    {field.description}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Data Preview & Error Resolution Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-900">Data Verification & Issue Resolver</h3>
                                        <span className="text-xs text-gray-500">
                                            ({displayedRows.length} rows showing)
                                        </span>
                                    </div>

                                    {/* Filter Pills */}
                                    <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setRowFilter('all')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                                                rowFilter === 'all'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            All Rows ({validationResult?.total_rows ?? 0})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRowFilter('ready')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                                                rowFilter === 'ready'
                                                    ? 'bg-white text-green-700 shadow-sm'
                                                    : 'text-gray-600 hover:text-green-700'
                                            }`}
                                        >
                                            Ready ({validationResult?.valid_count ?? 0})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRowFilter('errors')}
                                            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                                                rowFilter === 'errors'
                                                    ? 'bg-white text-red-700 shadow-sm'
                                                    : 'text-gray-600 hover:text-red-700'
                                            }`}
                                        >
                                            Needs Attention ({validationResult?.error_count ?? 0})
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto max-h-[480px]">
                                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                        <thead className="bg-gray-100/70 sticky top-0 z-10 text-gray-600 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-3 py-2.5 w-16">Status</th>
                                                <th className="px-3 py-2.5">Row #</th>
                                                <th className="px-3 py-2.5">Student Name</th>
                                                <th className="px-3 py-2.5">Email</th>
                                                <th className="px-3 py-2.5">CNIC / B-Form</th>
                                                <th className="px-3 py-2.5">Gender</th>
                                                <th className="px-3 py-2.5">Date of Birth</th>
                                                <th className="px-3 py-2.5">Parent Details</th>
                                                <th className="px-3 py-2.5 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {displayedRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="text-center py-8 text-gray-400">
                                                        No records matching this view filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayedRows.map((rowItem) => {
                                                    const r = rowItem.resolved || {};
                                                    const errs = rowItem.errors || {};

                                                    return (
                                                        <tr
                                                            key={rowItem.index}
                                                            className={`hover:bg-gray-50 transition ${
                                                                !rowItem.is_valid ? 'bg-red-50/20' : ''
                                                            }`}
                                                        >
                                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                                {rowItem.is_valid ? (
                                                                    <span className="text-green-600 font-bold flex items-center gap-1 text-[11px]">
                                                                        <FontAwesomeIcon icon={faCircleCheck} /> Valid
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-red-600 font-bold flex items-center gap-1 text-[11px]">
                                                                        <FontAwesomeIcon icon={faCircleExclamation} /> Issues
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-500 font-mono">
                                                                #{rowItem.index + 1}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-semibold text-gray-900">
                                                                {r.name || <span className="text-red-500 italic">Missing Name</span>}
                                                                {errs.name && (
                                                                    <div className="text-[10px] text-red-600 font-normal">
                                                                        {errs.name}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-700">
                                                                {r.email || <span className="text-gray-400">—</span>}
                                                                {errs.email && (
                                                                    <div className="text-[10px] text-red-600 font-normal">
                                                                        {errs.email}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-700 font-mono">
                                                                {r.cnic || <span className="text-gray-400">—</span>}
                                                                {errs.cnic && (
                                                                    <div className="text-[10px] text-red-600 font-normal">
                                                                        {errs.cnic}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 capitalize text-gray-700">
                                                                {r.gender || <span className="text-gray-400">—</span>}
                                                                {errs.gender && (
                                                                    <div className="text-[10px] text-red-600 font-normal">
                                                                        {errs.gender}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-700">
                                                                {r.date_of_birth || <span className="text-gray-400">—</span>}
                                                                {errs.date_of_birth && (
                                                                    <div className="text-[10px] text-red-600 font-normal">
                                                                        {errs.date_of_birth}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-gray-700">
                                                                {r.parent_name ? (
                                                                    <div>
                                                                        <div>{r.parent_name}</div>
                                                                        {r.parent_phone && (
                                                                            <div className="text-[10px] text-gray-500 font-mono">
                                                                                {r.parent_phone}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditRow(rowItem)}
                                                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-800 transition"
                                                                >
                                                                    <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                                                    Fix / Edit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                        Back to File Upload
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            !validationResult ||
                                            validationResult.valid_count === 0 ||
                                            importing
                                        }
                                        onClick={executeBatchImport}
                                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-sm"
                                    >
                                        {importing ? (
                                            <>
                                                <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                                                Importing Students...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faCheck} />
                                                Execute Import ({validationResult?.valid_count ?? 0} Students)
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* SCREEN 3: IMPORT SUMMARY & CREDENTIALS CARD                               */}
                    {/* ========================================================================= */}
                    {currentStep === 3 && importResult && (
                        <div className="space-y-6">
                            {/* Success Celebration Card */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl shadow-inner">
                                        <FontAwesomeIcon icon={faCheck} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">
                                            Import Completed Successfully!
                                        </h2>
                                        <p className="text-emerald-100 text-sm mt-1">
                                            Successfully created <strong>{importResult.imported_count}</strong> student profiles, user accounts, and class enrollments.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
                                    <div className="flex items-center gap-4">
                                        <span>Target Session: <strong>{importResult.target_group?.session}</strong></span>
                                        <span>·</span>
                                        <span>Class: <strong>{importResult.target_group?.class}</strong></span>
                                        <span>·</span>
                                        <span>Section: <strong>{importResult.target_group?.section}</strong></span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={copyAllCredentials}
                                            className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                                        >
                                            <FontAwesomeIcon icon={copiedAll ? faCheck : faCopy} />
                                            {copiedAll ? 'All Credentials Copied!' : 'Copy All Credentials'}
                                        </button>
                                        <Link
                                            href={route('academic.students')}
                                            className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition"
                                        >
                                            View in Student Management →
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Generated Credentials Table */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">
                                            Generated Student Portal Logins & Credentials
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Students can log in using either their Roll / ID Card Number or their registered Email with the temporary passwords below.
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                                        {importResult.credentials?.length || 0} Accounts Created
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                        <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">#</th>
                                                <th className="px-4 py-3">Student Name</th>
                                                <th className="px-4 py-3">Login ID / Roll No</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Temporary Password</th>
                                                <th className="px-4 py-3 text-right">Copy</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {importResult.credentials?.map((c, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3 text-gray-400 font-mono">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                                                    <td className="px-4 py-3 font-mono font-bold text-amber-700">
                                                        <code className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                            {c.login_id}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                                                    <td className="px-4 py-3 font-mono">
                                                        <code className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                                            {c.password}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => copySingleCredential(c, idx)}
                                                            className="text-gray-500 hover:text-amber-700 font-semibold text-xs transition"
                                                        >
                                                            <FontAwesomeIcon icon={copiedIndex === idx ? faCheck : faCopy} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFile(null);
                                            setValidationResult(null);
                                            setImportResult(null);
                                            setCurrentStep(1);
                                        }}
                                        className="text-xs font-bold text-gray-600 hover:text-gray-900"
                                    >
                                        + Import Another Batch
                                    </button>

                                    <Link
                                        href={route('academic.students')}
                                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-6 py-2 rounded-lg transition shadow-sm"
                                    >
                                        Finish & Go to Student List
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* INLINE ROW EDITING MODAL                                                  */}
                    {/* ========================================================================= */}
                    {editingRowIndex !== null && (
                        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                                        <FontAwesomeIcon icon={faPen} className="text-amber-500" />
                                        <span>Fix Data for Row #{editingRowIndex + 1}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingRowIndex(null)}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <FontAwesomeIcon icon={faXmark} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="sm:col-span-2">
                                        <label className="block font-bold text-gray-700 mb-1">
                                            Student Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={editFormData.name || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, name: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editFormData.email || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, email: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">CNIC / B-Form</label>
                                        <input
                                            type="text"
                                            value={editFormData.cnic || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, cnic: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Gender</label>
                                        <select
                                            value={editFormData.gender || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, gender: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="">-- Select Gender --</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">
                                            Date of Birth (YYYY-MM-DD)
                                        </label>
                                        <input
                                            type="date"
                                            value={editFormData.date_of_birth || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, date_of_birth: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Parent Name</label>
                                        <input
                                            type="text"
                                            value={editFormData.parent_name || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, parent_name: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-gray-700 mb-1">Parent Phone</label>
                                        <input
                                            type="text"
                                            value={editFormData.parent_phone || ''}
                                            onChange={(e) =>
                                                setEditFormData({ ...editFormData, parent_phone: e.target.value })
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingRowIndex(null)}
                                        className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveRowEdit}
                                        className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm"
                                    >
                                        Save & Re-verify
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
