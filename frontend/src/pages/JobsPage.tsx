import { useEffect } from 'react';
import { useJobStore } from '../state/jobStore';
import type { Job } from '../api/types';
import Table from '../ui/components/Table';
import Button from '../ui/components/Button';
import { toast } from '../utils/toast';

export default function JobsPage() {
    const { jobs, isLoading, error, fetchJobs, clearError } = useJobStore();

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    const columns = [
        {
            key: 'title' as keyof Job,
            header: 'Job Title',
            sortable: true,
            render: (job: Job) => (
                <div>
                    <div className="font-medium text-gray-900">{job.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{job.description}</div>
                </div>
            )
        },
        {
            key: 'skills' as keyof Job,
            header: 'Required Skills',
            render: (job: Job) => (
                <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {skill}
                        </span>
                    ))}
                    {job.skills.length > 3 && (
                        <span className="text-xs text-gray-500">+{job.skills.length - 3} more</span>
                    )}
                </div>
            )
        },
        {
            key: 'experience' as keyof Job,
            header: 'Experience',
            sortable: true,
            render: (job: Job) => (
                <span className="text-sm text-gray-900">
                    {job.experience ? `${job.experience} years` : 'Not specified'}
                </span>
            )
        },
        {
            key: 'education' as keyof Job,
            header: 'Education',
            render: (job: Job) => (
                <span className="text-sm text-gray-900">
                    {job.education || 'Not specified'}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Positions</h1>
                    <p className="text-gray-600 mt-1">Manage and view your job openings</p>
                </div>
                <Button>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Job
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                            <p className="text-2xl font-semibold text-gray-900">{jobs.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Active</p>
                            <p className="text-2xl font-semibold text-gray-900">{jobs.length}</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Avg. Experience</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {jobs.length > 0
                                    ? (jobs.reduce((sum, job) => sum + (job.experience || 0), 0) / jobs.length).toFixed(1)
                                    : '0'
                                } yrs
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Jobs Table */}
            <Table
                columns={columns}
                rows={jobs}
                loading={isLoading}
                emptyMessage="No job positions found"
                onRowClick={(job) => console.log('Clicked job:', job)}
            />
        </div>
    );
}


