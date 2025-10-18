import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMatchingStore } from '../state/matchingStore';
import { useJobStore } from '../state/jobStore';
import { useUIStore } from '../state/uiStore';
import { MatchCard } from '../components/features/results/MatchCard';
import { MatchFilters } from '../components/features/results/MatchFilters';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Pagination } from '../components/common/Pagination';
import { PageSpinner, Spinner } from '../components/common/Spinner';
import { Modal, ModalFooter } from '../components/common/Modal';
import toast from 'react-hot-toast';
import MatchingService, { type MatchSortField, type MatchSortOrder } from '../services/matchingService';

export default function ResultsPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    // Store state
    const {
        filteredMatches,
        pagination,
        isLoading,
        isMutating,
        error,
        filters,
        sortState,
        fetchMatches,
        setFilters,
        setSortState,
        clearFilters,
        clearMatches,
        setCurrentJobId,
        getScoreDistribution,
        getAverageScore,
        getMostCommonMissingSkills,
        clearError
    } = useMatchingStore();

    const { fetchJobById, currentJob } = useJobStore();

    const { openModal, closeModal, isModalOpen } = useUIStore();

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Sort options
    const sortOptions = [
        { value: 'overall-desc', label: 'Overall Score (High → Low)', field: 'overallMatchScore' as MatchSortField, order: 'desc' as MatchSortOrder },
        { value: 'overall-asc', label: 'Overall Score (Low → High)', field: 'overallMatchScore' as MatchSortField, order: 'asc' as MatchSortOrder },
        { value: 'skills-desc', label: 'Skills Match (High → Low)', field: 'skillsMatchScore' as MatchSortField, order: 'desc' as MatchSortOrder },
        { value: 'experience-desc', label: 'Experience Match (High → Low)', field: 'experienceMatchScore' as MatchSortField, order: 'desc' as MatchSortOrder },
        { value: 'education-desc', label: 'Education Match (High → Low)', field: 'educationMatchScore' as MatchSortField, order: 'desc' as MatchSortOrder },
        { value: 'technical-desc', label: 'Technical Fit (High → Low)', field: 'technicalMatchScore' as MatchSortField, order: 'desc' as MatchSortOrder },
        { value: 'date-desc', label: 'Matched Date (Newest)', field: 'matchedAt' as MatchSortField, order: 'desc' as MatchSortOrder },
        { value: 'date-asc', label: 'Matched Date (Oldest)', field: 'matchedAt' as MatchSortField, order: 'asc' as MatchSortOrder }
    ];

    // Initial load
    useEffect(() => {
        if (jobId) {
            console.log('📍 ResultsPage loading for jobId:', jobId);
            setCurrentJobId(jobId);

            // Fetch job and matches in sequence
            const loadData = async () => {
                try {
                    await fetchJobById(jobId);
                    fetchMatchesWithSort();
                } catch (error) {
                    console.error('Failed to load job:', error);
                }
            };

            loadData();
        }
    }, [jobId, fetchJobById]);

    // Handle errors
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    // Fetch with current sort
    const fetchMatchesWithSort = () => {
        if (!jobId) return;

        const query = MatchingService.buildQueryWithSort(
            sortState.field,
            sortState.order,
            currentPage,
            pageSize
        );

        fetchMatches(jobId, query);
    };

    // Handle sort change
    const handleSortChange = (value: string) => {
        const option = sortOptions.find(opt => opt.value === value);
        if (option) {
            setSortState({ field: option.field, order: option.order });
            setCurrentPage(1);

            // Fetch with new sort
            setTimeout(() => fetchMatchesWithSort(), 0);
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setTimeout(() => fetchMatchesWithSort(), 0);
    };

    // Handle export
    const handleExport = async (format: 'csv' | 'json') => {
        if (!jobId) return;

        setIsExporting(true);
        try {
            const query = MatchingService.buildQueryWithSort(
                sortState.field,
                sortState.order,
                1,
                1000 // Export all
            );

            const blob = await MatchingService.exportMatches(jobId, format, query);
            MatchingService.downloadMatchesFile(blob, jobId, format);
            toast.success(`Exported ${filteredMatches.length} matches as ${format.toUpperCase()}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to export matches');
        } finally {
            setIsExporting(false);
        }
    };

    // Handle clear matches
    const handleClearMatches = async () => {
        if (!jobId) return;

        try {
            await clearMatches(jobId);
            toast.success('All matches cleared');
            closeModal('clear-confirm');
            navigate('/jobs');
        } catch (error: any) {
            toast.error(error.message || 'Failed to clear matches');
        }
    };

    // Handle re-run match
    const handleRerunMatch = () => {
        if (!jobId) return;
        navigate(`/match?jobId=${jobId}`);
    };

    // Get current sort value
    const getCurrentSortValue = () => {
        const option = sortOptions.find(
            opt => opt.field === sortState.field && opt.order === sortState.order
        );
        return option?.value || 'overall-desc';
    };

    // Calculate stats
    const stats = {
        total: pagination.total || 0,
        strong: filteredMatches.filter(m => (m.overallMatchScore || 0) >= 90).length,
        average: getAverageScore(),
        topScore: filteredMatches.length > 0
            ? Math.max(...filteredMatches.map(m => m.overallMatchScore || 0))
            : 0
    };

    // Get score distribution
    const scoreDistribution = getScoreDistribution();

    // Get top missing skills
    const topMissingSkills = getMostCommonMissingSkills(5);

    // Active filter count
    const activeFilterCount = [
        filters.scoreThresholds?.overall,
        filters.scoreThresholds?.skills,
        filters.scoreThresholds?.experience,
        filters.requiredSkills?.length,
        filters.maxExperienceGap !== undefined,
        filters.minEducationQuality
    ].filter(Boolean).length;

    // Show loading state while fetching initial data
    if (isLoading && !currentJob) {
        return <PageSpinner label="Loading results..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            to="/jobs"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Match Results</h1>
                    </div>
                    {currentJob && (
                        <div>
                            <p className="text-gray-600">
                                Results for: <span className="font-semibold">{currentJob.title}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {stats.total} candidate{stats.total !== 1 ? 's' : ''} analyzed
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openModal('export-menu')}
                        disabled={isExporting || filteredMatches.length === 0}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export
                    </Button>
                    <Button size="sm" onClick={handleRerunMatch}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-run Match
                    </Button>
                </div>
            </div>

            {/* Job Summary Card */}
            {currentJob ? (
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{currentJob.title}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{currentJob.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {currentJob.skills.map((skill: string) => (
                                    <span
                                        key={skill}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 ml-6 space-y-1">
                            <div>
                                <span className="font-medium">Experience:</span> {currentJob.experience || 'Not specified'} years
                            </div>
                            {currentJob.education && (
                                <div>
                                    <span className="font-medium">Education:</span> {currentJob.education}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="p-6">
                    <div className="text-center py-4">
                        <p className="text-gray-500">Loading job details...</p>
                    </div>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Matches</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Excellent (90%+)</p>
                            <p className="text-2xl font-semibold text-gray-900">{stats.strong}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Average Score</p>
                            <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.average)}%</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Top Score</p>
                            <p className="text-2xl font-semibold text-gray-900">{Math.round(stats.topScore)}%</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter & Sort Bar */}
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
                        value={getCurrentSortValue()}
                        onChange={(e) => handleSortChange(e.target.value)}
                        className="input py-2 px-3"
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {filteredMatches.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal('clear-confirm')}
                        >
                            Clear All Matches
                        </Button>
                    )}
                </div>
            </div>

            {/* Score Distribution Summary */}
            {filteredMatches.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{scoreDistribution.excellent}</div>
                            <div className="text-sm text-gray-500">Excellent (90-100%)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{scoreDistribution.good}</div>
                            <div className="text-sm text-gray-500">Good (75-89%)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-600">{scoreDistribution.fair}</div>
                            <div className="text-sm text-gray-500">Fair (60-74%)</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-600">{scoreDistribution.poor}</div>
                            <div className="text-sm text-gray-500">Below Average (&lt;60%)</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Top Missing Skills */}
            {topMissingSkills.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Missing Skills</h3>
                    <div className="flex flex-wrap gap-3">
                        {topMissingSkills.map(({ skill, count }) => (
                            <div key={skill} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                <span className="font-medium text-red-900">{skill}</span>
                                <span className="text-sm text-red-600">({count} candidates)</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Match Results Grid */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Spinner />
                    <span className="ml-3 text-gray-600">Loading matches...</span>
                </div>
            ) : filteredMatches.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            {activeFilterCount > 0 ? 'No matches found with current filters' : 'No matches yet'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            {activeFilterCount > 0
                                ? 'Try adjusting your filter criteria'
                                : 'Run a match to see candidates for this job'}
                        </p>
                        <div className="mt-6">
                            <Button onClick={activeFilterCount > 0 ? clearFilters : handleRerunMatch}>
                                {activeFilterCount > 0 ? 'Clear Filters' : 'Run Match'}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredMatches.map((match, index) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            rank={index + 1}
                            showFullDetails={index === 0}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {filteredMatches.length > 0 && pagination.totalPages && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Filters Modal */}
            <Modal isOpen={showFilters} onClose={() => setShowFilters(false)} title="Filter Matches" size="lg">
                <div className="py-4">
                    <MatchFilters
                        initialFilters={{
                            minOverallScore: filters.scoreThresholds?.overall || 0,
                            minSkillsScore: filters.scoreThresholds?.skills || 0,
                            minExperienceScore: filters.scoreThresholds?.experience || 0,
                            minEducationScore: filters.scoreThresholds?.education || 0,
                            minTechnicalScore: filters.scoreThresholds?.technical || 0,
                            experienceGap: 'ANY',
                            educationMatch: 'ANY',
                            requiredMatchedSkills: filters.requiredSkills || []
                        }}
                        availableSkills={currentJob?.skills || []}
                        onApply={(newFilters) => {
                            setFilters({
                                scoreThresholds: {
                                    overall: newFilters.minOverallScore,
                                    skills: newFilters.minSkillsScore,
                                    experience: newFilters.minExperienceScore,
                                    education: newFilters.minEducationScore,
                                    technical: newFilters.minTechnicalScore
                                },
                                requiredSkills: newFilters.requiredMatchedSkills,
                                maxExperienceGap: newFilters.experienceGap === 'NONE' ? 0 :
                                    newFilters.experienceGap === '0-1' ? 1 :
                                        newFilters.experienceGap === '2+' ? 2 : undefined,
                                minEducationQuality: newFilters.educationMatch === 'PERFECT' ? 'Perfect' :
                                    newFilters.educationMatch === 'GOOD' ? 'Good' :
                                        newFilters.educationMatch === 'PARTIAL' ? 'Fair' : undefined
                            });
                            setShowFilters(false);
                        }}
                    />
                </div>
            </Modal>

            {/* Export Menu Modal */}
            <Modal isOpen={isModalOpen('export-menu')} onClose={() => closeModal('export-menu')} title="Export Matches">
                <div className="py-4 space-y-3">
                    <p className="text-sm text-gray-600">
                        Choose a format to export {filteredMatches.length} match result{filteredMatches.length !== 1 ? 's' : ''}:
                    </p>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => {
                                handleExport('csv');
                                closeModal('export-menu');
                            }}
                            disabled={isExporting}
                            className="flex-1"
                        >
                            Export as CSV
                        </Button>
                        <Button
                            onClick={() => {
                                handleExport('json');
                                closeModal('export-menu');
                            }}
                            disabled={isExporting}
                            className="flex-1"
                        >
                            Export as JSON
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Clear Confirmation Modal */}
            <Modal isOpen={isModalOpen('clear-confirm')} onClose={() => closeModal('clear-confirm')} title="Clear All Matches">
                <div className="py-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to delete all match results for this job? This action cannot be undone.
                    </p>
                </div>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => closeModal('clear-confirm')}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleClearMatches} disabled={isMutating}>
                        Clear All Matches
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
