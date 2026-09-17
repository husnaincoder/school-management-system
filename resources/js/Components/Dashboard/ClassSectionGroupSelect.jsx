import React, { useMemo } from 'react';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';

export function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section ?? csg.classSection;
    const session = cs?.academic_session?.name ?? cs?.academicSession?.name ?? '';
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [session, cls, sec, grp].filter(Boolean).join(' · ') || String(csg.id);
}

export default function ClassSectionGroupSelect({
    groups = [],
    value,
    onChange,
    error,
    inputClass,
    label = 'Class Section Group',
    required = false,
    excludeIds = [],
    placeholder = 'Search session, class, section or group...',
    className = '',
}) {
    const excludeSet = useMemo(() => new Set(excludeIds.map(String)), [excludeIds]);

    const options = useMemo(
        () =>
            groups
                .filter((group) => !excludeSet.has(String(group.id)))
                .map((group) => {
                    const cs = group.class_section ?? group.classSection;
                    const session = cs?.academic_session?.name ?? cs?.academicSession?.name ?? '';
                    const cls = cs?.class?.name ?? '';
                    const sec = cs?.section?.name ?? '';
                    const grp = group.subject_group?.name ?? group.subjectGroup?.name ?? '';
                    const fullLabel = groupLabel(group);

                    return {
                        value: group.id,
                        label: fullLabel,
                        sublabel: [cls, sec, grp].filter(Boolean).join(' · '),
                        searchText: [session, cls, sec, grp, fullLabel].filter(Boolean).join(' '),
                        selectedLabel: fullLabel,
                    };
                }),
        [groups, excludeSet]
    );

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && ' *'}
                </label>
            )}
            <SearchableSelect
                options={options}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                inputClassName={inputClass(error)}
                emptyText="No class section group found"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
