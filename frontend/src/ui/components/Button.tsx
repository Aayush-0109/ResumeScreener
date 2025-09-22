import clsx from 'clsx';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
};

export default function Button({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    ...rest
}: Props) {
    return (
        <button
            className={clsx(
                'btn',
                {
                    'btn-primary': variant === 'primary',
                    'btn-secondary': variant === 'secondary',
                    'btn-ghost': variant === 'ghost',
                    'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
                    'px-3 py-1.5 text-xs': size === 'sm',
                    'px-4 py-2 text-sm': size === 'md',
                    'px-6 py-3 text-base': size === 'lg',
                },
                className
            )}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
}


