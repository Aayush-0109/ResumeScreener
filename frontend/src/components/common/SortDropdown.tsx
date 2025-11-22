import React from 'react';
import { clsx } from 'clsx';

export interface SortOption {
    label: string;
    value: string;
    field: string;
    order: 'asc' | 'desc';
}

interface SortDropdownProps {
    options: SortOption[];
    value: string;
    onChange: (option: SortOption) => void;
    className?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
    options,
    value,
    onChange,
    className,
}) => {
    return (
        <div className={clsx('inline-block', className)}>
            <label htmlFor="sort-select" className="sr-only">
                Sort by
            </label>
            <select
                id="sort-select"
                value={value}
                onChange={(e) => {
                    const option = options.find((opt) => opt.value === e.target.value);
                    if (option) onChange(option);
                }}
                className="select pr-10"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};


export const SortButton: React.FC<{
    label: string;
    active: boolean;
    direction?: 'asc' | 'desc';
    onClick: () => void;
}> = ({ label, active, direction = 'asc', onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'inline-flex items-center gap-1 font-medium transition-colors',
                active ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'
            )}
        >
            {label}
            <svg
                className={clsx('w-4 h-4 transition-transform', {
                    'rotate-180': direction === 'desc',
                    'opacity-50': !active,
                })}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                />
            </svg>
        </button>
    );
};

