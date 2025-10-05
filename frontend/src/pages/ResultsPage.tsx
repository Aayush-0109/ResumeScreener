import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMatchingStore } from '../state/matchingStore';
import { useJobStore } from '../state/jobStore';
import type { MatchResult as Match } from '../api/types';
import Table from '../ui/components/Table';
import Button from '../ui/components/Button';
import { toast } from '../utils/toast';

type MatchResultWithId = Match & { id: string };

export default function ResultsPage() {
    const { jobId } = useParams();
    const [searchParams] = useSearchParams();
    const queueId = searchParams.get('queueId');

    const { matches, isLoading, isMutating, error: matchError, matchQueue, fetchMatches, checkMatchStatus, exportMatches, clearError: clearMatchError } = useMatchingStore();
    const { jobs, fetchJobs } = useJobStore();
    const [exporting, setExporting] = useState(false);

    const job = jobs.find(j => j.id === jobId);

    useEffect(() => {
        if (jobId) {
            fetchMatches(jobId);
        }
        if (jobs.length === 0) {
            fetchJobs();
        }
    }, [jobId, fetchMatches, fetchJobs, jobs.length]);

    useEffect(() => {
        if (matchError) {
            toast.error(matchError);
            clearMatchError();
        }
    }, [matchError, clearMatchError]);

    useEffect(() => {
        if (!queueId) return;

        const interval = setInterval(async () => {
            await checkMatchStatus(queueId);
            const { matchQueue } = useMatchingStore.getState();

            if (matchQueue?.status === 'COMPLETED') {
                toast.success('Matching completed!');
                if (jobId) {
                    await fetchMatches(jobId);
                }
                clearInterval(interval);
            } else if (matchQueue?.status === 'FAILED') {
                toast.error('Matching failed: ' + matchQueue.errorMessage);
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [queueId, checkMatchStatus, jobId, fetchMatches]);

    async function handleExport(format: 'csv' | 'json') {
        if (!jobId) return;

        setExporting(true);
        try {
            await exportMatches(jobId, format);
            toast.success(`Exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    }

    async function handleRerun() {
        if (!jobId) return;
        toast.info('Re-running match...');
        // Navigate back to match page with pre-selected job
        window.location.href = `/match?jobId=${jobId}`;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading results...</span>
            </div>
        );
    }

    const matchesWithId: MatchResultWithId[] = matches.map(m => ({ ...m, id: m.resumeId }));

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600 bg-green-50';
        if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getScoreBadge = (score: number) => {
        const percentage = (score * 100).toFixed(0);
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
                {percentage}%
            </span>
        );
    };

    const columns = [
        {
            key: 'resumeId' as keyof MatchResultWithId,
            header: 'Candidate',
            render: (match: MatchResultWithId) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Candidate</div>
                        <div className="text-sm text-gray-500">{match.resumeId}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'overallMatchScore' as keyof MatchResultWithId,
            header: 'Overall Match',
            sortable: true,
            render: (match: MatchResultWithId) => (
                <div className="text-center">
                    {getScoreBadge(match.overallMatchScore || 0)}
                </div>
            )
        },
        {
            key: 'skillsMatchScore' as keyof MatchResultWithId,
            header: 'Skills',
            sortable: true,
            render: (match: MatchResultWithId) => (
                <div className="text-center">
                    {getScoreBadge(match.skillsMatchScore || 0)}
                </div>
            )
        },
        {
            key: 'experienceMatchScore' as keyof MatchResultWithId,
            header: 'Experience',
            sortable: true,
            render: (match: MatchResultWithId) => (
                <div className="text-center">
                    {getScoreBadge(match.experienceMatchScore || 0)}
                </div>
            )
        },
        {
            key: 'educationMatchScore' as keyof MatchResultWithId,
            header: 'Education',
            sortable: true,
            render: (match: MatchResultWithId) => (
                <div className="text-center">
                    {getScoreBadge(match.educationMatchScore || 0)}
                </div>
            )
        },
        {
            key: 'matchedSkills' as keyof MatchResultWithId,
            header: 'Matched Skills',
            render: (match: MatchResultWithId) => (
                <div className="flex flex-wrap gap-1">
                    {match.matchedSkills.slice(0, 2).map(skill => (
                        <span key={skill} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                            {skill}
                        </span>
                    ))}
                    {match.matchedSkills.length > 2 && (
                        <span className="text-xs text-gray-500">+{match.matchedSkills.length - 2}</span>
                    )}
                </div>
            )
        },
        {
            key: 'missingSkills' as keyof MatchResultWithId,
            header: 'Missing Skills',
            render: (match: MatchResultWithId) => (
                <div className="flex flex-wrap gap-1">
                    {match.missingSkills.slice(0, 2).map(skill => (
                        <span key={skill} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                            {skill}
                        </span>
                    ))}
                    {match.missingSkills.length > 2 && (
                        <span className="text-xs text-gray-500">+{match.missingSkills.length - 2}</span>
                    )}
                </div>
            )
        }
    ];



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            to="/match"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Matching Results</h1>
                    </div>
                    {job && (
                        <div>
                            <p className="text-gray-600">Results for: <span className="font-medium">{job.title}</span></p>
                            <p className="text-sm text-gray-500 mt-1">{matches.length} candidates analyzed</p>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleExport('csv')} disabled={exporting || isMutating}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {exporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                    <Button size="sm" onClick={handleRerun} disabled={isMutating}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-run Matching
                    </Button>
                </div>
            </div>

            {/* Job Summary Card */}
            {job && (
                <div className="card p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{job.title}</h3>
                            <p className="text-gray-600 mb-4">{job.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {job.skills.map(skill => (
                                    <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 ml-6">
                            <div>Experience: {job.experience || 'Not specified'} years</div>
                            <div>Education: {job.education || 'Not specified'}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Matches</p>
                            <p className="text-2xl font-semibold text-gray-900">{matches.length}</p>
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
                            <p className="text-sm font-medium text-gray-500">Strong Matches</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {matches.filter(m => (m.overallMatchScore || 0) >= 0.8).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Average Score</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {matches.length > 0
                                    ? ((matches.reduce((sum, m) => sum + (m.overallMatchScore || 0), 0) / matches.length) * 100).toFixed(0)
                                    : '0'
                                }%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Top Score</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {matches.length > 0
                                    ? (Math.max(...matches.map(m => m.overallMatchScore || 0)) * 100).toFixed(0)
                                    : '0'
                                }%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <Table
                columns={columns}
                rows={matchesWithId}
                loading={isLoading}
                emptyMessage="No matching results found"
                onRowClick={(match) => console.log('Clicked match:', match)}
            />
        </div>
    );
}


