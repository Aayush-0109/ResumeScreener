import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import type { Job } from '../../../api/types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface JobCardProps {
    job: Job;
    matchCount?: number;
    onEdit?: (job: Job) => void;
    onDelete?: (job: Job) => void;
    onMatch?: (job: Job) => void;
    showActions?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
    job,
    matchCount,
    onEdit,
    onDelete,
    onMatch,
    showActions = true,
}) => {
    const navigate = useNavigate();

    return (
        <Card hover className="transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        {job.location && (
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                {job.location}
                            </span>
                        )}
                        {job.salary && (
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                {job.salary}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{job.description}</p>

            {job.skills && job.skills.length > 0 && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                        {job.skills.slice(0, 5).map((skill, index) => (
                            <span
                                key={index}
                                className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                        {job.skills.length > 5 && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                +{job.skills.length - 5} more
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {job.experience !== null && job.experience !== undefined && (
                    <span>
                        <span className="font-medium">Experience:</span> {job.experience}+ years
                    </span>
                )}
                {job.education && (
                    <span>
                        <span className="font-medium">Education:</span> {job.education}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                    <p>Posted {format(new Date(job.createdAt), 'MMM d, yyyy')}</p>
                    {matchCount !== undefined && (
                        <p className="font-medium text-blue-600">
                            {matchCount} {matchCount === 1 ? 'match' : 'matches'} available
                        </p>
                    )}
                </div>

                {showActions && (
                    <div className="flex gap-2">
                        {matchCount !== undefined && matchCount > 0 && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => navigate(`/results/${job.id}`)}
                            >
                                View Matches
                            </Button>
                        )}
                        {onMatch && (
                            <Button size="sm" variant="secondary" onClick={() => onMatch(job)}>
                                Match Now
                            </Button>
                        )}
                        {onEdit && (
                            <Button size="sm" variant="ghost" onClick={() => onEdit(job)}>
                                Edit
                            </Button>
                        )}
                        {onDelete && (
                            <Button size="sm" variant="danger" onClick={() => onDelete(job)}>
                                Delete
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

