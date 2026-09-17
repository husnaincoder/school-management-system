import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';

export default function ParentFieldSelect({ parentList = [], value, onChange, onNew, error, inputClass }) {
    const options = useMemo(
        () =>
            parentList.map((parent) => {
                const name = parent.user?.name ?? `Parent #${parent.id}`;
                const idCard = parent.user?.id_card_number ?? '';
                const phone = parent.user?.phone ?? '';
                const searchText = [name, idCard, phone].filter(Boolean).join(' ');

                return {
                    value: parent.id,
                    label: name,
                    sublabel: [idCard, phone].filter(Boolean).join(' · '),
                    searchText,
                    selectedLabel: idCard ? `${name} · ${idCard}` : name,
                };
            }),
        [parentList]
    );

    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-sm font-medium text-gray-700">Parent</label>
                <button
                    type="button"
                    onClick={onNew}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    New
                </button>
            </div>
            <SearchableSelect
                options={options}
                value={value}
                onChange={onChange}
                placeholder="Search by name, ID card or phone..."
                inputClassName={inputClass(error)}
                emptyText="No parent found"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
