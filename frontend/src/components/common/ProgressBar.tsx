import React from 'react';
import { clsx } from 'clsx';

export interface ProgressBarProps {
    value: number; // 0-100
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    showLabel?: boolean;
    label?: string;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    className,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const variantClasses = {
        default: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        danger: 'bg-red-600',
    };

    return (
        <div className={clsx('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                        {label || `${percentage.toFixed(0)}%`}
                    </span>
                    <span className="text-sm text-gray-500">
                        {value} / {max}
                    </span>
                </div>
            )}
            <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
                <div
                    className={clsx(
                        'h-full transition-all duration-300 ease-in-out',
                        variantClasses[variant]
                    )}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    );
};

/**
 * Indeterminate progress bar for unknown duration tasks
 */
export const IndeterminateProgressBar: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
}> = ({ size = 'md', variant = 'default', className }) => {
    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const variantClasses = {
        default: 'bg-blue-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        danger: 'bg-red-600',
    };

    return (
        <div className={clsx('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size], className)}>
            <div
                className={clsx(
                    'h-full animate-progress-indeterminate',
                    variantClasses[variant]
                )}
                style={{ width: '30%' }}
            />
        </div>
    );
};

