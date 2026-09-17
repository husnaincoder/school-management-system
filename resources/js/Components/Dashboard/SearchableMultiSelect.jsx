import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Searchable multi-select dropdown.
 * value: array of selected option values
 * onChange: (nextValues: array) => void
 */
export default function SearchableMultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = 'Search and select...',
    inputClassName = '',
    emptyText = 'No results found',
    disabled = false,
    disabledText = 'Select group first',
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    const selectedOptions = useMemo(
        () => options.filter((option) => selectedSet.has(String(option.value))),
        [options, selectedSet]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((option) => {
            const haystack = String(option.searchText ?? option.label ?? '').toLowerCase();
            return haystack.includes(q);
        });
    }, [options, query]);

    const allFilteredSelected =
        filtered.length > 0 && filtered.every((option) => selectedSet.has(String(option.value)));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const emitChange = (next) => {
        onChange(next.map((v) => {
            const match = options.find((o) => String(o.value) === String(v));
            return match ? match.value : v;
        }));
    };

    const toggleValue = (optionValue) => {
        const key = String(optionValue);
        if (selectedSet.has(key)) {
            emitChange(selectedValues.filter((v) => v !== key));
        } else {
            emitChange([...selectedValues, key]);
        }
    };

    const removeValue = (optionValue) => {
        const key = String(optionValue);
        emitChange(selectedValues.filter((v) => v !== key));
    };

    const toggleSelectAllFiltered = () => {
        if (allFilteredSelected) {
            const filteredKeys = new Set(filtered.map((o) => String(o.value)));
            emitChange(selectedValues.filter((v) => !filteredKeys.has(v)));
        } else {
            const next = new Set(selectedValues);
            filtered.forEach((o) => next.add(String(o.value)));
            emitChange([...next]);
        }
    };

    if (disabled) {
        return (
            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 bg-gray-50">
                {disabledText}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <div
                className={`w-full min-h-[42px] border rounded-lg px-2 py-1.5 bg-white flex flex-wrap items-center gap-1.5 cursor-text ${
                    open ? 'ring-2 ring-amber-400 border-amber-400' : 'border-gray-300'
                } ${inputClassName}`}
                onClick={() => {
                    setOpen(true);
                }}
            >
                {selectedOptions.map((option) => (
                    <span
                        key={option.value}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 text-xs font-medium px-2 py-1 border border-amber-200"
                    >
                        {option.selectedLabel ?? option.label}
                        <button
                            type="button"
                            className="text-amber-600 hover:text-amber-800 leading-none"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeValue(option.value);
                            }}
                            aria-label={`Remove ${option.label}`}
                        >
                            ×
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    className="flex-1 min-w-[120px] border-0 outline-none focus:ring-0 text-sm py-1 px-1 bg-transparent"
                    placeholder={selectedOptions.length === 0 ? placeholder : 'Search more...'}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    autoComplete="off"
                />
            </div>

            {open && (
                <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                    {filtered.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                            <span className="text-xs text-gray-500">
                                {selectedOptions.length} selected
                            </span>
                            <button
                                type="button"
                                className="text-xs font-medium text-amber-600 hover:text-amber-700"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={toggleSelectAllFiltered}
                            >
                                {allFilteredSelected ? 'Clear all' : 'Select all'}
                            </button>
                        </div>
                    )}

                    <ul className="max-h-48 overflow-auto">
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
                        ) : (
                            filtered.map((option) => {
                                const checked = selectedSet.has(String(option.value));
                                return (
                                    <li key={option.value}>
                                        <button
                                            type="button"
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-amber-50 flex items-center gap-2 ${
                                                checked ? 'bg-amber-50 text-amber-700' : 'text-gray-900'
                                            }`}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => toggleValue(option.value)}
                                        >
                                            <span
                                                className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                                                    checked
                                                        ? 'bg-amber-500 border-amber-500 text-white'
                                                        : 'border-gray-300 bg-white'
                                                }`}
                                            >
                                                {checked && (
                                                    <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                                                        <path d="M10.3 2.7a1 1 0 0 1 0 1.4l-4.5 4.5a1 1 0 0 1-1.4 0L1.7 5.9a1 1 0 1 1 1.4-1.4l1.9 1.9 3.8-3.8a1 1 0 0 1 1.5.1z" />
                                                    </svg>
                                                )}
                                            </span>
                                            <span className="block font-medium">{option.label}</span>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
