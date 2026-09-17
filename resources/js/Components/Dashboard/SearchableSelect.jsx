import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = 'Search...',
    inputClassName = '',
    emptyText = 'No results found',
    disabled = false,
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const menuRef = useRef(null);

    const selected = options.find((option) => String(option.value) === String(value));

    const filtered = options.filter((option) => {
        const haystack = String(option.searchText ?? option.label ?? '').toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
    });

    const updateMenuPosition = () => {
        const el = inputRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const spaceBelow = viewportH - rect.bottom;
        const openUp = spaceBelow < 220 && rect.top > spaceBelow;
        const maxHeight = Math.min(240, openUp ? rect.top - 12 : spaceBelow - 12);

        setMenuStyle({
            position: 'fixed',
            left: rect.left,
            width: Math.max(rect.width, 160),
            zIndex: 9999,
            maxHeight: Math.max(120, maxHeight),
            ...(openUp
                ? { bottom: viewportH - rect.top + 4 }
                : { top: rect.bottom + 4 }),
        });
    };

    useLayoutEffect(() => {
        if (!open) return undefined;
        updateMenuPosition();
        const onReposition = () => updateMenuPosition();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [open, filtered.length]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const inInput = containerRef.current?.contains(event.target);
            const inMenu = menuRef.current?.contains(event.target);
            if (!inInput && !inMenu) {
                setOpen(false);
                setQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(String(optionValue));
        setQuery('');
        setOpen(false);
    };

    const menu = open && menuStyle
        ? createPortal(
            <ul
                ref={menuRef}
                style={menuStyle}
                className="overflow-auto rounded-lg border border-gray-200 bg-white shadow-xl"
            >
                {filtered.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
                ) : (
                    filtered.map((option, index) => (
                        <li key={`${String(option.value)}-${index}`}>
                            <button
                                type="button"
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                                    String(option.value) === String(value)
                                        ? 'bg-amber-50 text-amber-700 font-medium'
                                        : 'text-gray-900'
                                }`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className="block font-medium">{option.label}</span>
                                {option.sublabel && (
                                    <span className="block text-xs text-gray-500 mt-0.5">{option.sublabel}</span>
                                )}
                            </button>
                        </li>
                    ))
                )}
            </ul>,
            document.body
        )
        : null;

    return (
        <div ref={containerRef} className="relative">
            <input
                ref={inputRef}
                type="text"
                disabled={disabled}
                className={inputClassName}
                placeholder={placeholder}
                value={open ? query : (selected?.selectedLabel ?? selected?.label ?? '')}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    if (!e.target.value) {
                        onChange('');
                    }
                }}
                onFocus={() => {
                    if (disabled) return;
                    setOpen(true);
                    setQuery('');
                }}
                autoComplete="off"
            />
            {menu}
        </div>
    );
}
