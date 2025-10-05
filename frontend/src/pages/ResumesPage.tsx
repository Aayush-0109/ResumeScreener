import { useEffect, useMemo, useRef, useState } from 'react';
import { useResumeStore } from '../state/resumeStore';
import type { Resume } from '../api/types';
import FileUpload from '../ui/components/FileUpload';
import Table from '../ui/components/Table';
import Button from '../ui/components/Button';
import { toast } from '../utils/toast';

export default function ResumesPage() {
    const { resumes, isLoading, isMutating, isProcessing, error, fetchResumes, uploadResumes, startProcessingMonitor, stopProcessingMonitor, clearError } = useResumeStore();
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [pollingQueueId, setPollingQueueId] = useState<string | null>(null);
    const [skillsInput, setSkillsInput] = useState<string>('');
    const [expMin, setExpMin] = useState<string>('');
    const [expMax, setExpMax] = useState<string>('');
    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        fetchResumes();
    }, [fetchResumes]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    useEffect(() => {
        return () => stopProcessingMonitor();
    }, [stopProcessingMonitor]);

    // Debounced server-side filtering aligned with backend (skills, experienceMin, experienceMax)
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            const query: any = {};
            if (skillsInput.trim()) query.skills = skillsInput.trim();
            if (expMin.trim()) query.experienceMin = expMin.trim();
            if (expMax.trim()) query.experienceMax = expMax.trim();
            fetchResumes(query);
        }, 400);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [skillsInput, expMin, expMax, fetchResumes]);

    async function handleUpload(files: FileList) {
        if (!files.length) return;

        setUploadError(null);
        setUploadSuccess(null);

        try {
            const arr = Array.from(files);
            await uploadResumes(arr);
            setUploadSuccess(`Successfully queued ${arr.length} resumes for processing!`);
            startProcessingMonitor();
            toast.info('Resumes uploaded! Processing in background...');
        } catch (error) {
            setUploadError('Failed to upload resumes. Please try again.');
            toast.error('Upload failed');
        }
    }

    const columns = [
        {
            key: 'fileName' as keyof Resume,
            header: 'Resume',
            render: (resume: Resume) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <div className="ml-4">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{resume.name || resume.fileName}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${(resume as any).parseStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {(resume as any).parseStatus === 'PENDING' ? 'Pending' : 'Parsed'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500">{resume.fileName}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'email' as keyof Resume,
            header: 'Contact',
            render: (resume: Resume) => (
                <div>
                    {resume.email ? (
                        <div className="text-sm text-gray-900">{resume.email}</div>
                    ) : (
                        <div className="text-sm text-gray-500">No email</div>
                    )}
                    <div className="text-xs text-gray-500">
                        {(resume.fileSize / 1024).toFixed(1)} KB
                    </div>
                </div>
            )
        },
        {
            key: 'skills' as keyof Resume,
            header: 'Skills',
            render: (resume: Resume) => (
                <div className="flex flex-wrap gap-1">
                    {resume.skills.slice(0, 2).map(skill => (
                        <span key={skill} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                        </span>
                    ))}
                    {resume.skills.length > 2 && (
                        <span className="text-xs text-gray-500">+{resume.skills.length - 2}</span>
                    )}
                </div>
            )
        },
        {
            key: 'experience' as keyof Resume,
            header: 'Experience',
            sortable: true,
            render: (resume: Resume) => (
                <span className="text-sm text-gray-900">
                    {resume.experience ? `${resume.experience} years` : 'Not specified'}
                </span>
            )
        },
        {
            key: 'uploadedAt' as keyof Resume,
            header: 'Uploaded',
            sortable: true,
            render: (resume: Resume) => (
                <span className="text-sm text-gray-500">
                    {new Date(resume.uploadedAt).toLocaleDateString()}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Resume Library</h1>
                    <p className="text-gray-600 mt-1">Upload and manage candidate resumes</p>
                </div>
            </div>

            {/* Upload Section */}
            <div className="card p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload New Resumes</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Upload multiple resume files. They will be processed asynchronously and parsed automatically.
                    </p>
                </div>

                <FileUpload
                    multiple
                    accept=".pdf,.doc,.docx"
                    maxSize={10}
                    onFiles={handleUpload}
                    onError={setUploadError}
                    disabled={isMutating}
                />

                {uploadError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex">
                            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">Upload Error</p>
                                <p className="text-sm text-red-700">{uploadError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {uploadSuccess && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex">
                            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">Upload Successful</p>
                                <p className="text-sm text-green-700">{uploadSuccess}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="card p-4 flex flex-wrap items-end gap-3">
                <div className="w-full md:w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                    <input className="input" placeholder="react, node, sql" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Exp</label>
                    <input className="input w-28" type="number" min={0} value={expMin} onChange={e => setExpMin(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Exp</label>
                    <input className="input w-28" type="number" min={0} value={expMax} onChange={e => setExpMax(e.target.value)} />
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="secondary" onClick={() => { setSkillsInput(''); setExpMin(''); setExpMax(''); fetchResumes(); }}>Reset</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Resumes</p>
                            <p className="text-2xl font-semibold text-gray-900">{resumes.length}</p>
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
                            <p className="text-sm font-medium text-gray-500">Processed</p>
                            <p className="text-2xl font-semibold text-gray-900">{resumes.length}</p>
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
                                {resumes.length > 0
                                    ? (resumes.reduce((sum, resume) => sum + (resume.experience || 0), 0) / resumes.length).toFixed(1)
                                    : '0'
                                } yrs
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
                            <p className="text-sm font-medium text-gray-500">Total Size</p>
                            <p className="text-2xl font-semibold text-gray-900">
                                {(resumes.reduce((sum, resume) => sum + resume.fileSize, 0) / 1024 / 1024).toFixed(1)} MB
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Processing Banner */}
            {isProcessing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" strokeWidth="4" className="opacity-75" />
                    </svg>
                    <div className="text-sm text-blue-800">Parsing resumes… This may take a minute. You can continue using the app.</div>
                </div>
            )}

            {/* Resumes Table */}
            <Table
                columns={columns}
                rows={resumes}
                loading={isLoading}
                emptyMessage="No resumes uploaded yet"
                onRowClick={(resume) => console.log('Clicked resume:', resume)}
            />
        </div>
    );
}


