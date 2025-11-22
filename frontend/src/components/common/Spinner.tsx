import React from 'react';
import { clsx } from 'clsx';

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    className,
    label = 'Loading...'
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <svg
                className={clsx(
                    'animate-spin text-blue-600',
                    sizeClasses[size],
                    className
                )}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-label={label}
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {label && (
                <span className="text-sm text-gray-600">{label}</span>
            )}
        </div>
    );
};


export const PageSpinner: React.FC<{ label?: string }> = ({ label }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Spinner size="xl" label={label} />
        </div>
    );
};


export const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            className={clsx('animate-spin h-4 w-4', className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
};

