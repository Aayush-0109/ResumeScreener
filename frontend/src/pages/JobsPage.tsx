import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../state/jobStore';
import { useUIStore } from '../state/uiStore';
import { JobCard } from '../components/features/jobs/JobCard';
import { JobForm } from '../components/features/jobs/JobForm';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../components/ui/pagination';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import type { CreateJobData, Job } from '../api/types';
import { Plus, Search, Briefcase, CheckCircle2, Clock } from 'lucide-react';

export default function JobsPage() {
    const navigate = useNavigate();

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

    
    const [searchInput, setSearchInput] = useState(queryState.searchQuery);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    
    const debouncedSearch = useDebounce(searchInput, 500);

    
    const sortOptions = [
        { value: 'newest', label: 'Newest First', field: 'createdAt' as const, order: 'desc' as const },
        { value: 'oldest', label: 'Oldest First', field: 'createdAt' as const, order: 'asc' as const },
        { value: 'updated', label: 'Recently Updated', field: 'updatedAt' as const, order: 'desc' as const },
        { value: 'title-asc', label: 'Title (A-Z)', field: 'title' as const, order: 'asc' as const },
        { value: 'title-desc', label: 'Title (Z-A)', field: 'title' as const, order: 'desc' as const }
    ];

    
    useEffect(() => {
        buildQueryAndFetch();
    }, []); 

    
    useEffect(() => {
        if (debouncedSearch !== queryState.searchQuery) {
            setSearchQuery(debouncedSearch);
            buildQueryAndFetch();
        }
    }, [debouncedSearch]);

    
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    
    const getCurrentSortValue = () => {
        const currentSort = queryState.sortOptions[0];
        if (!currentSort) return 'newest';

        const option = sortOptions.find(
            opt => opt.field === currentSort.field && opt.order === currentSort.order
        );
        return option?.value || 'newest';
    };

    
    const handleSortChange = (value: string) => {
        const option = sortOptions.find(opt => opt.value === value);
        if (option) {
            setSortOptions([{ field: option.field, order: option.order }]);
            buildQueryAndFetch();
        }
    };

    
    const handlePageChange = (page: number) => {
        setPage(page);
        buildQueryAndFetch();
    };

    
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

    
    const handleMatchJob = (jobId: string) => {
        navigate(`/match?jobId=${jobId}`);
    };

    
    const stats = {
        total: pagination.total || 0,
        active: jobs.length,
        avgExperience: jobs.length > 0
            ? (jobs.reduce((sum, j) => sum + (j.experience || 0), 0) / jobs.length).toFixed(1)
            : '0'
    };

    if (isLoading && jobs.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Job Positions</h1>
                    <p className="text-muted-foreground mt-1">Manage and track your open roles</p>
                </div>
                <Button onClick={() => openModal('create-job')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Job
                </Button>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg. Experience</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.avgExperience} yrs</p>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search jobs by title, description, or requirements..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select
                    value={getCurrentSortValue()}
                    onValueChange={handleSortChange}
                >
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {}
            {jobs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="max-w-md mx-auto">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            {searchInput ? 'No jobs found' : 'No jobs yet'}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {searchInput
                                ? "Try adjusting your search query"
                                : "Create your first job posting to get started"}
                        </p>
                        <div className="mt-6">
                            <Button
                                variant={searchInput ? "outline" : "default"}
                                onClick={searchInput ? () => setSearchInput('') : () => openModal('create-job')}
                            >
                                {searchInput ? "Clear Search" : "Create Job"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onEdit={() => {
                                setEditingJob(job);
                                openModal('edit-job');
                            }}
                            onDelete={() => setShowDeleteConfirm(job.id)}
                            onMatch={() => handleMatchJob(job.id)}
                        />
                    ))}
                </div>
            )}

            {}
            {jobs.length > 0 && pagination.totalPages && pagination.totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => handlePageChange((pagination.page || 1) - 1)}
                                className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={page === pagination.page}
                                    onClick={() => handlePageChange(page)}
                                    className="cursor-pointer"
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => handlePageChange((pagination.page || 1) + 1)}
                                className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {}
            <Dialog open={isModalOpen('create-job')} onOpenChange={(open) => !open && closeModal('create-job')}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Job</DialogTitle>
                    </DialogHeader>
                    <JobForm
                        onSubmit={handleCreateJob}
                        onCancel={() => closeModal('create-job')}
                    />
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={isModalOpen('edit-job')} onOpenChange={(open) => {
                if (!open) {
                    closeModal('edit-job');
                    setEditingJob(null);
                }
            }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Job</DialogTitle>
                    </DialogHeader>
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
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Job</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to delete this job? This action cannot be undone and will also delete all associated match results.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => showDeleteConfirm && handleDeleteJob(showDeleteConfirm)}
                            disabled={isMutating}
                        >
                            Delete Job
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
