import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResumeStore } from '../state/resumeStore';
import { useUIStore } from '../state/uiStore';
import { ResumeCard } from '../components/features/resumes/ResumeCard';
import { ResumeFilters } from '../components/features/resumes/ResumeFilters';
import { ParseProgressModal } from '../components/features/resumes/ParseProgressModal';
import { Button } from '../components/common/Button';
import { Modal, ModalFooter } from '../components/common/Modal';
import { Card } from '../components/common/Card';
import { Pagination } from '../components/common/Pagination';
import { PageSpinner, Spinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function ResumesPage() {

    const {
        filteredResumes,
        pagination,
        isLoading,
        isMutating,
        error,
        filters,
        sortBy,
        bulkSelection,
        fetchResumes,
        uploadResumes,
        deleteResume,
        bulkDeleteResumes,
        clearAllResumes,
        setFilters,
        setSortBy,
        clearFilters,
        clearSelection,
        getSelectedResumeIds,
        clearError
    } = useResumeStore();

    const { openModal, closeModal, isModalOpen } = useUIStore();
    const location = useLocation();
    const navigate = useNavigate();


    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [parseQueueId, setParseQueueId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);


    const sortOptions = [
        { label: 'Newest First', value: 'newest' },
        { label: 'Oldest First', value: 'oldest' },
        { label: 'Name (A-Z)', value: 'name-asc' },
        { label: 'Name (Z-A)', value: 'name-desc' },
        { label: 'Experience (High to Low)', value: 'exp-high' },
        { label: 'Experience (Low to High)', value: 'exp-low' },
        { label: 'Most Skills First', value: 'skills-count' }
    ];


    useEffect(() => {
        fetchResumesWithFilters();
    }, []);


    useEffect(() => {
        const state = location.state as { openUploadModal?: boolean } | undefined;
        if (state?.openUploadModal) {
            openModal('upload-resumes');
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, location.pathname, openModal, navigate]);


    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);


    const fetchResumesWithFilters = () => {
        const query: any = {
            page: currentPage,
            limit: pageSize
        };


        if (filters.skills && filters.skills.length > 0) {
            query.skills = filters.skills;
        }
        if (filters.experienceMin !== undefined) {
            query.experienceMin = filters.experienceMin;
        }
        if (filters.experienceMax !== undefined) {
            query.experienceMax = filters.experienceMax;
        }

        fetchResumes(query);
    };


    useEffect(() => {
        fetchResumesWithFilters();
    }, [currentPage, pageSize, filters.skills, filters.experienceMin, filters.experienceMax]);


    const handleUpload = async (files: File[]) => {
        if (!files.length) return;

        try {
            await uploadResumes(files);

            toast.success(`${files.length} resumes uploaded successfully! Processing in background...`);
            clearSelection();


            setTimeout(() => fetchResumesWithFilters(), 1000);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload resumes');
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) return;

        try {
            await deleteResume(id);
            toast.success('Resume deleted successfully');
            fetchResumesWithFilters();
        } catch (error) {
            toast.error('Failed to delete resume');
        }
    };


    const handleBulkDelete = async () => {
        const selectedIds = getSelectedResumeIds();
        if (!selectedIds.length) {
            toast.error('No resumes selected');
            return;
        }

        if (!confirm(`Delete ${selectedIds.length} selected resumes?`)) return;

        openModal('bulk-action', { action: 'delete', count: selectedIds.length });

        try {
            await bulkDeleteResumes(selectedIds);
            toast.success(`${selectedIds.length} resumes deleted`);
            closeModal('bulk-action');
            clearSelection();
            fetchResumesWithFilters();
        } catch (error) {
            toast.error('Failed to delete some resumes');
            closeModal('bulk-action');
        }
    };


    const handleClearAll = async () => {
        if (!confirm('This will delete ALL your resumes. Are you sure?')) return;

        openModal('clear-confirm');

        try {
            await clearAllResumes();
            toast.success('All resumes cleared');
            closeModal('clear-confirm');
            clearSelection();
            fetchResumesWithFilters();
        } catch (error) {
            toast.error('Failed to clear resumes');
            closeModal('clear-confirm');
        }
    };


    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };


    const handleSortChange = (newSort: string) => {
        setSortBy(newSort as any);
    };


    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };


    const stats = {
        total: pagination.total || 0,
        parsed: filteredResumes.filter(r => r.parseStatus === 'DONE').length,
        pending: filteredResumes.filter(r => r.parseStatus === 'PENDING').length,
        avgExperience: filteredResumes.length > 0
            ? (filteredResumes.reduce((sum, r) => sum + (r.experience || 0), 0) / filteredResumes.length).toFixed(1)
            : '0'
    };


    const activeFilterCount = [
        filters.skills?.length,
        filters.experienceMin !== undefined,
        filters.experienceMax !== undefined,
        filters.parseStatus && filters.parseStatus !== 'ALL',
        filters.uploadDate && filters.uploadDate !== 'all'
    ].filter(Boolean).length;


    const hasSelection = bulkSelection.selectedIds.size > 0;

    if (isLoading && filteredResumes.length === 0) {
        return <PageSpinner label="Loading resumes..." />;
    }

    return (
        <div className="space-y-6">
            { }
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Resume Library</h1>
                    <p className="text-gray-600 mt-1">Upload and manage candidate resumes</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => openModal('upload-resumes')}
                        disabled={isMutating}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Resumes
                    </Button>
                </div>
            </div>

            { }
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Resumes</p>
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
                            <p className="text-sm font-medium text-gray-500">Parsed</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.parsed}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Pending</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
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

            { }
            <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowFilters(true)}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="input py-2 px-3"
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {hasSelection && (
                        <>
                            <Button variant="secondary" size="sm" onClick={clearSelection}>
                                Clear ({bulkSelection.selectedIds.size})
                            </Button>
                            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                                Delete Selected
                            </Button>
                        </>
                    )}
                    {filteredResumes.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleClearAll}>
                            Clear All
                        </Button>
                    )}
                </div>
            </div>

            { }
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Spinner />
                    <span className="ml-3 text-gray-600">Loading resumes...</span>
                </div>
            ) : filteredResumes.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No resumes found</h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {activeFilterCount > 0 ? "Try adjusting your filters" : "Upload your first resume to get started"}
                        </p>
                        <div className="mt-6">
                            <Button onClick={activeFilterCount > 0 ? clearFilters : () => openModal('upload-resumes')}>
                                {activeFilterCount > 0 ? "Clear Filters" : "Upload Resume"}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResumes.map((resume) => (
                        <ResumeCard
                            key={resume.id}
                            resume={resume}
                            onDelete={() => handleDelete(resume.id)}
                        />
                    ))}
                </div>
            )}

            { }
            {filteredResumes.length > 0 && pagination.totalPages && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            { }
            {parseQueueId && (
                <ParseProgressModal
                    isOpen={isModalOpen('parse-progress')}
                    queueId={parseQueueId}
                    onClose={() => {
                        closeModal('parse-progress');
                        setParseQueueId(null);
                        fetchResumesWithFilters();
                    }}
                />
            )}

            { }
            <Modal isOpen={isModalOpen('upload-resumes')} onClose={() => closeModal('upload-resumes')} title="Upload Resumes">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Upload multiple resume files (PDF, DOC, DOCX). Maximum file size: 10MB per file.
                    </p>
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                            if (e.target.files) {
                                handleUpload(Array.from(e.target.files));
                                closeModal('upload-resumes');
                            }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => closeModal('upload-resumes')}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>

            { }
            <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filter Resumes" size="lg">
                <div className="py-4">
                    <ResumeFilters
                        initialFilters={{
                            skills: filters.skills || [],
                            experienceMin: filters.experienceMin,
                            experienceMax: filters.experienceMax,
                            parseStatus: filters.parseStatus
                        }}
                        onApply={(newFilters) => {
                            handleFilterChange(newFilters);
                            setShowFilters(false);
                        }}
                    />
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowFilters(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
