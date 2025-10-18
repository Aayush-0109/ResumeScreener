import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../state/jobStore';
import { useUIStore } from '../state/uiStore';
import { JobCard } from '../components/features/jobs/JobCard';
import { JobForm } from '../components/features/jobs/JobForm';
import { Button } from '../components/common/Button';
import { Modal, ModalFooter } from '../components/common/Modal';
import { Card } from '../components/common/Card';
import { Pagination } from '../components/common/Pagination';
import { PageSpinner, Spinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import type { CreateJobData, Job } from '../api/types';

export default function JobsPage() {
    const navigate = useNavigate();

    // Store state
    const {
        jobs,
        pagination,
        isLoading,
        isMutating,
        error,
        queryState,
        createJob,
        updateJob,
        deleteJob,
        setSearchQuery,
        setSortOptions,
        setPage,
        buildQueryAndFetch,
        clearError
    } = useJobStore();

    const { openModal, closeModal, isModalOpen } = useUIStore();

    // Local state
    const [searchInput, setSearchInput] = useState(queryState.searchQuery);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Debounce search input
    const debouncedSearch = useDebounce(searchInput, 500);

    // Sort options for dropdown
    const sortOptions = [
        { value: 'newest', label: 'Newest First', field: 'createdAt' as const, order: 'desc' as const },
        { value: 'oldest', label: 'Oldest First', field: 'createdAt' as const, order: 'asc' as const },
        { value: 'updated', label: 'Recently Updated', field: 'updatedAt' as const, order: 'desc' as const },
        { value: 'title-asc', label: 'Title (A-Z)', field: 'title' as const, order: 'asc' as const },
        { value: 'title-desc', label: 'Title (Z-A)', field: 'title' as const, order: 'desc' as const }
    ];

    // Initial fetch
    useEffect(() => {
        buildQueryAndFetch();
    }, []);

    // Handle search changes
    useEffect(() => {
        if (debouncedSearch !== queryState.searchQuery) {
            setSearchQuery(debouncedSearch);
            buildQueryAndFetch();
        }
    }, [debouncedSearch]);

    // Handle errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    // Get current sort value for dropdown
    const getCurrentSortValue = () => {
        const currentSort = queryState.sortOptions[0];
        if (!currentSort) return 'newest';

        const option = sortOptions.find(
            opt => opt.field === currentSort.field && opt.order === currentSort.order
        );
        return option?.value || 'newest';
    };

    // Handle sort change
    const handleSortChange = (value: string) => {
        const option = sortOptions.find(opt => opt.value === value);
        if (option) {
            setSortOptions([{ field: option.field, order: option.order }]);
            buildQueryAndFetch();
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setPage(page);
        buildQueryAndFetch();
    };

    // Handle create job
    const handleCreateJob = async (data: CreateJobData) => {
        try {
            await createJob(data);
            toast.success('Job created successfully!');
            closeModal('create-job');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create job');
            throw error;
        }
    };

    // Handle edit job
    const handleEditJob = async (data: Partial<CreateJobData>) => {
        if (!editingJob) return;

        try {
            await updateJob(editingJob.id, data);
            toast.success('Job updated successfully!');
            closeModal('edit-job');
            setEditingJob(null);
            buildQueryAndFetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update job');
            throw error;
        }
    };

    // Handle delete job
    const handleDeleteJob = async (id: string) => {
        try {
            await deleteJob(id);
            toast.success('Job deleted successfully');
            setShowDeleteConfirm(null);
            buildQueryAndFetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete job');
        }
    };

    // Handle match navigation
    const handleMatchJob = (jobId: string) => {
        navigate(`/match?jobId=${jobId}`);
    };

    // Handle view matches
    const handleViewMatches = (jobId: string) => {
        navigate(`/results/${jobId}`);
    };

    // Calculate stats
    const stats = {
        total: pagination.total || 0,
        active: jobs.length,
        avgExperience: jobs.length > 0
            ? (jobs.reduce((sum, j) => sum + (j.experience || 0), 0) / jobs.length).toFixed(1)
            : '0'
    };

    if (isLoading && jobs.length === 0) {
        return <PageSpinner label="Loading jobs..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Job Positions</h1>
                    <p className="text-gray-600 mt-1">Manage and view your job openings</p>
                </div>
                <Button onClick={() => openModal('create-job')}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Job
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Active Listings</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Avg. Experience</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.avgExperience} yrs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search jobs by title, description, or requirements..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="input pl-10 w-full"
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <select
                    value={getCurrentSortValue()}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="input py-2 px-4 w-full sm:w-auto"
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Job Cards Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Spinner />
                    <span className="ml-3 text-gray-600">Loading jobs...</span>
                </div>
            ) : jobs.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            {searchInput ? 'No jobs found' : 'No jobs yet'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {searchInput
                                ? "Try adjusting your search query"
                                : "Create your first job posting to get started"}
                        </p>
                        <div className="mt-6">
                            <Button onClick={searchInput ? () => setSearchInput('') : () => openModal('create-job')}>
                                {searchInput ? "Clear Search" : "Create Job"}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <div key={job.id} className="relative">
                            <JobCard
                                job={job}
                                onEdit={() => {
                                    setEditingJob(job);
                                    openModal('edit-job');
                                }}
                                onDelete={() => setShowDeleteConfirm(job.id)}
                                onMatch={() => handleMatchJob(job.id)}
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleViewMatches(job.id)}
                                className="mt-2 w-full"
                            >
                                View Matches
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {jobs.length > 0 && pagination.totalPages && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={pagination.page || 1}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Create Job Modal */}
            <Modal isOpen={isModalOpen('create-job')} onClose={() => closeModal('create-job')} title="Create New Job" size="lg">
                <div className="py-4">
                    <JobForm
                        onSubmit={handleCreateJob}
                        onCancel={() => closeModal('create-job')}
                    />
                </div>
            </Modal>

            {/* Edit Job Modal */}
            <Modal isOpen={isModalOpen('edit-job')} onClose={() => {
                closeModal('edit-job');
                setEditingJob(null);
            }} title="Edit Job" size="lg">
                <div className="py-4">
                    {editingJob && (
                        <JobForm
                            initialData={{
                                title: editingJob.title,
                                description: editingJob.description,
                                requirements: editingJob.requirements,
                                skills: editingJob.skills,
                                experience: editingJob.experience || undefined,
                                education: editingJob.education || undefined,
                                location: editingJob.location || undefined,
                                salary: editingJob.salary || undefined
                            }}
                            onSubmit={handleEditJob}
                            onCancel={() => {
                                closeModal('edit-job');
                                setEditingJob(null);
                            }}
                            submitLabel="Update Job"
                        />
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                title="Delete Job"
            >
                <div className="py-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to delete this job? This action cannot be undone and will also delete all associated match results.
                    </p>
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => showDeleteConfirm && handleDeleteJob(showDeleteConfirm)}
                        disabled={isMutating}
                    >
                        Delete Job
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
