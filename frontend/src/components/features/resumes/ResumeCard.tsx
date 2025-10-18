import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import type { Resume } from '../../../api/types';
import { format } from 'date-fns';

interface ResumeCardProps {
    resume: Resume;
    onView?: (resume: Resume) => void;
    onDelete?: (resume: Resume) => void;
    showActions?: boolean;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({
    resume,
    onView,
    onDelete,
    showActions = true,
}) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    const getParseStatusBadge = () => {
        const statusConfig = {
            DONE: { color: 'bg-green-100 text-green-800', icon: '✓', label: 'Done' },
            PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pending' },
            FAILED: { color: 'bg-red-100 text-red-800', icon: '✗', label: 'Failed' },
        };

        const config = statusConfig[resume.parseStatus as keyof typeof statusConfig];

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <span className="mr-1">{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Card hover className="transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {resume.name || 'Unknown Name'}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        {resume.email && (
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {resume.email}
                            </span>
                        )}
                        {resume.phone && (
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {resume.phone}
                            </span>
                        )}
                    </div>
                </div>
                <div>{getParseStatusBadge()}</div>
            </div>

            {resume.experience !== null && resume.experience !== undefined && (
                <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Experience:</span> {resume.experience} years
                </p>
            )}

            {resume.education && (
                <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Education:</span> {resume.education}
                </p>
            )}

            {resume.skills && resume.skills.length > 0 && (
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">Skills ({resume.skills.length}):</p>
                        {resume.skills.length > 6 && (
                            <button
                                onClick={() => setShowAllSkills(!showAllSkills)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {showAllSkills ? 'Show Less' : 'Show All'}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {(showAllSkills ? resume.skills : resume.skills.slice(0, 6)).map((skill, index) => (
                            <span
                                key={index}
                                className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200"
                            >
                                {skill}
                            </span>
                        ))}
                        {!showAllSkills && resume.skills.length > 6 && (
                            <button
                                onClick={() => setShowAllSkills(true)}
                                className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
                            >
                                +{resume.skills.length - 6} more
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                    <p>{resume.fileName}</p>
                    <p>
                        {formatFileSize(resume.fileSize)} • Uploaded{' '}
                        {format(new Date(resume.uploadedAt), 'MMM d, yyyy')}
                    </p>
                </div>

                {showActions && (
                    <div className="flex gap-2">
                        {onView && (
                            <Button size="sm" variant="secondary" onClick={() => onView(resume)}>
                                View
                            </Button>
                        )}
                        {onDelete && (
                            <Button size="sm" variant="danger" onClick={() => onDelete(resume)}>
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
