import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '../state/resumeStore';
import { useJobStore } from '../state/jobStore';
import { useAuthStore } from '../state/authStore';
import { useUIStore } from '../state/uiStore';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressBar } from '../components/common/ProgressBar';
import { PageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
    totalResumes: number;
    parsedResumes: number;
    pendingResumes: number;
    failedResumes: number;
    totalJobs: number;
    recentMatches: number;
    avgMatchScore: number;
}

interface ActivityItem {
    id: string;
    type: 'upload' | 'job' | 'match' | 'error';
    title: string;
    description: string;
    timestamp: Date;
    status?: 'success' | 'warning' | 'error' | 'info';
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { openModal } = useUIStore();

    
    const {
        resumes,
        pagination: resumePagination,
        fetchResumes
    } = useResumeStore();

    const {
        jobs,
        pagination: jobPagination,
        buildQueryAndFetch: fetchJobs
    } = useJobStore();

    
    const [stats, setStats] = useState<DashboardStats>({
        totalResumes: 0,
        parsedResumes: 0,
        pendingResumes: 0,
        failedResumes: 0,
        totalJobs: 0,
        recentMatches: 0,
        avgMatchScore: 0
    });

    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                await Promise.all([
                    fetchResumes({ page: 1, limit: 50 }),
                    fetchJobs()
                ]);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setIsInitialLoad(false);
            }
        };

        loadDashboardData();
    }, []);

    
    useEffect(() => {
        if (resumes.length > 0 || jobs.length > 0) {
            const parsedCount = resumes.filter(r => r.parseStatus === 'DONE').length;
            const pendingCount = resumes.filter(r => r.parseStatus !== 'DONE' && r.parseStatus !== 'FAILED').length;
            const failedCount = resumes.filter(r => r.parseStatus === 'FAILED').length;

            setStats({
                totalResumes: resumePagination.total || resumes.length,
                parsedResumes: parsedCount,
                pendingResumes: pendingCount,
                failedResumes: failedCount,
                totalJobs: jobPagination.total || jobs.length,
                recentMatches: 0, 
                avgMatchScore: 0
            });

            
            generateActivityFeed();
        }
    }, [resumes, jobs, resumePagination, jobPagination]);

    
    const generateActivityFeed = () => {
        const newActivities: ActivityItem[] = [];

        
        resumes
            .slice(0, 5)
            .forEach((resume) => {
                newActivities.push({
                    id: `resume-${resume.id}`,
                    type: 'upload',
                    title: 'Resume Uploaded',
                    description: `${resume.name || 'Unknown candidate'} - ${resume.parseStatus === 'DONE' ? 'Parsed successfully' : resume.parseStatus === 'FAILED' ? 'Parse failed' : 'Parsing in progress'}`,
                    timestamp: new Date(resume.uploadedAt),
                    status: resume.parseStatus === 'DONE' ? 'success' : resume.parseStatus === 'FAILED' ? 'error' : 'info'
                });
            });

        
        jobs
            .slice(0, 5)
            .forEach((job) => {
                newActivities.push({
                    id: `job-${job.id}`,
                    type: 'job',
                    title: 'Job Posted',
                    description: `${job.title} - ${job.skills.length} skills required`,
                    timestamp: new Date(job.createdAt),
                    status: 'success'
                });
            });

        
        newActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setActivities(newActivities.slice(0, 10));
    };

    
    const handleUploadResumes = () => {
        navigate('/resumes', { state: { openUploadModal: true } });
    };

    const handleCreateJob = () => {
        navigate('/jobs');
        setTimeout(() => openModal('create-job'), 100);
    };

    const handleRunMatch = () => {
        navigate('/match');
    };

    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    
    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'success':
                return (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    if (isInitialLoad) {
        return <PageSpinner label="Loading dashboard..." />;
    }

    return (
        <div className="space-y-6">
            {}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    {getGreeting()}, {user?.name || 'User'}! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                    Welcome to your AI-powered recruitment dashboard
                </p>
            </div>

            {}
            <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                        onClick={handleUploadResumes}
                        variant="primary"
                        size="lg"
                        className="h-24 flex flex-col items-center justify-center"
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Resumes
                    </Button>

                    <Button
                        onClick={handleCreateJob}
                        variant="secondary"
                        size="lg"
                        className="h-24 flex flex-col items-center justify-center"
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z" />
                        </svg>
                        Create Job
                    </Button>

                    <Button
                        onClick={handleRunMatch}
                        variant="secondary"
                        size="lg"
                        className="h-24 flex flex-col items-center justify-center"
                        disabled={stats.totalResumes === 0 || stats.totalJobs === 0}
                    >
                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Run AI Match
                    </Button>
                </div>
            </Card>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {}
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/resumes')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Resumes</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-gray-900">{stats.totalResumes}</p>
                        <div className="flex items-center text-sm text-gray-600">
                            <span className="text-green-600 mr-1">✓ {stats.parsedResumes}</span>
                            {stats.pendingResumes > 0 && (
                                <span className="text-yellow-600 ml-2">⏳ {stats.pendingResumes}</span>
                            )}
                            {stats.failedResumes > 0 && (
                                <span className="text-red-600 ml-2">✗ {stats.failedResumes}</span>
                            )}
                        </div>
                    </div>
                    {stats.totalResumes > 0 && (
                        <div className="mt-4">
                            <ProgressBar
                                value={stats.parsedResumes}
                                max={stats.totalResumes}
                                variant="success"
                                size="sm"
                            />
                        </div>
                    )}
                </Card>

                {}
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/jobs')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Jobs</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
                        <p className="text-sm text-gray-600">Active positions</p>
                    </div>
                </Card>

                {}
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/jobs')}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Matches</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-gray-900">{stats.recentMatches}</p>
                        <p className="text-sm text-gray-600">Last 7 days</p>
                    </div>
                </Card>

                {}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Status</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600">All Systems Operational</p>
                        <p className="text-sm text-gray-600">Ready to process</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
                        <span className="text-sm text-gray-500">{activities.length} items</span>
                    </div>

                    {activities.length === 0 ? (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="mt-4 text-sm text-gray-500">No recent activity</p>
                            <p className="text-xs text-gray-400 mt-1">Upload resumes or create jobs to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getStatusIcon(activity.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                        <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${stats.totalResumes > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {stats.totalResumes > 0 ? '✓' : '1'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900">Upload Resumes</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {stats.totalResumes > 0
                                        ? `${stats.totalResumes} resumes uploaded`
                                        : 'Start by uploading candidate resumes in PDF, DOC, or DOCX format'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${stats.totalJobs > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {stats.totalJobs > 0 ? '✓' : '2'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900">Create Job Positions</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {stats.totalJobs > 0
                                        ? `${stats.totalJobs} jobs created`
                                        : 'Define job requirements, skills, and experience needed'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${stats.recentMatches > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                {stats.recentMatches > 0 ? '✓' : '3'}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900">Run AI Matching</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {stats.recentMatches > 0
                                        ? `${stats.recentMatches} recent matches`
                                        : 'Let AI analyze and match candidates to your job positions'}
                                </p>
                                {stats.totalResumes > 0 && stats.totalJobs > 0 && stats.recentMatches === 0 && (
                                    <Button
                                        size="sm"
                                        onClick={handleRunMatch}
                                        className="mt-2"
                                    >
                                        Run Your First Match
                                    </Button>
                                )}
                            </div>
                        </div>

                        {stats.totalResumes > 0 && stats.totalJobs > 0 && stats.recentMatches > 0 && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-800">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-sm font-medium">You're all set!</span>
                                </div>
                                <p className="text-sm text-green-700 mt-2">
                                    Your recruitment workflow is running smoothly. Continue managing your candidates and job positions.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Pro Tips</h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Upload multiple resumes at once for faster processing</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Use specific skills and requirements in job descriptions for better matching accuracy</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Adjust matching weights to prioritize what matters most for each position</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>Export match results to share with your team or integrate with your ATS</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}

