import { useState } from 'react';
import clsx from 'clsx';

type Column<T> = {
    key: keyof T;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
};

type TableProps<T> = {
    columns: Column<T>[];
    rows: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
};

export default function Table<T extends { id?: string | number }>({
    columns,
    rows,
    loading = false,
    emptyMessage = "No data available",
    onRowClick
}: TableProps<T>) {
    const [sortField, setSortField] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: keyof T) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedRows = [...rows].sort((a, b) => {
        if (!sortField) return 0;
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) {
        return (
            <div className="card p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="card p-8 text-center">
                <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2m16-7H4" />
                    </svg>
                    <p className="text-lg font-medium text-gray-900 mb-1">{emptyMessage}</p>
                    <p className="text-gray-500">Get started by adding some data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(column => (
                                <th
                                    key={String(column.key)}
                                    className={clsx(
                                        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                        column.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                                        column.width && `w-${column.width}`
                                    )}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.header}
                                        {column.sortable && (
                                            <div className="flex flex-col">
                                                <svg
                                                    className={clsx('w-3 h-3', sortField === column.key && sortDirection === 'asc' ? 'text-primary-600' : 'text-gray-400')}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedRows.map((row, i) => (
                            <tr
                                key={row.id ?? i}
                                className={clsx(
                                    'hover:bg-gray-50 transition-colors',
                                    onRowClick && 'cursor-pointer'
                                )}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map(column => (
                                    <td
                                        key={String(column.key)}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {column.render ? column.render(row) : (row[column.key] as any)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


