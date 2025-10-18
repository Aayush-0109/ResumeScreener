import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useJobStore } from '../state/jobStore';
import { useMatchingStore } from '../state/matchingStore';
import { useUIStore } from '../state/uiStore';
import { MatchProgressModal } from '../components/features/matching/MatchProgressModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageSpinner } from '../components/common/Spinner';
import toast from 'react-hot-toast';
import type { Job, MatchOptions } from '../api/types';

export default function MatchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Store state
  const {
    jobs,
    isLoading: loadingJobs,
    error: jobError,
    buildQueryAndFetch,
    clearError: clearJobError
  } = useJobStore();

  const {
    enqueueMatch,
    isMutating,
    error: matchError,
    lastConfig,
    setCurrentJobId,
    clearError: clearMatchError
  } = useMatchingStore();

  const { openModal, closeModal, isModalOpen } = useUIStore();

  // Local state
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [matchConfig, setMatchConfig] = useState<MatchOptions>(
    lastConfig || {
      topN: 10,
      insightsTopK: 5
    }
  );
  const [matchQueueId, setMatchQueueId] = useState<string | null>(null);

  // Load jobs and pre-select from URL
  useEffect(() => {
    buildQueryAndFetch();

    // Check if jobId is provided in URL
    const jobIdFromUrl = searchParams.get('jobId');
    if (jobIdFromUrl) {
      setSelectedJobId(jobIdFromUrl);
    }
  }, []);

  // Handle job errors
  useEffect(() => {
    if (jobError) {
      toast.error(jobError);
      clearJobError();
    }
  }, [jobError, clearJobError]);

  // Handle match errors
  useEffect(() => {
    if (matchError) {
      toast.error(matchError);
      clearMatchError();
    }
  }, [matchError, clearMatchError]);

  // Get selected job
  const selectedJob: Job | undefined = jobs.find(j => j.id === selectedJobId);

  // Handle start matching
  const handleStartMatch = async () => {
    if (!selectedJobId) {
      toast.error('Please select a job first');
      return;
    }

    try {
      console.log('🚀 Starting match for job:', selectedJobId);
      console.log('📋 Match config:', matchConfig);

      const queueId = await enqueueMatch(selectedJobId, matchConfig);

      console.log('✅ Match enqueued, queueId:', queueId);

      setMatchQueueId(queueId);
      setCurrentJobId(selectedJobId);
      openModal('match-progress', { queueId, jobId: selectedJobId });

      toast.success('Matching queued successfully!');
    } catch (error: any) {
      console.error('❌ Match error:', error);
      toast.error(error.message || 'Failed to start matching');
    }
  };


  if (loadingJobs && jobs.length === 0) {
    return <PageSpinner label="Loading jobs..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">AI Resume Matching</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Select a job position and configure matching parameters to find the best candidates using advanced AI algorithms
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto">
        {jobs.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs available</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create a job first before running a match
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/jobs')}>
                Go to Jobs
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <div className="space-y-6">
              {/* Step 1: Job Selection */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-semibold mr-3">
                    1
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Select Job Position</h2>
                </div>

                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="input w-full"
                  disabled={isMutating}
                >
                  <option value="">Choose a job position...</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} ({job.skills.length} skills required)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Job Preview */}
              {selectedJob && (
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedJob.title}</h3>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{selectedJob.description}</p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-primary-700 border border-primary-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Experience:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {selectedJob.experience ? `${selectedJob.experience} years` : 'Not specified'}
                        </span>
                      </div>
                      {selectedJob.education && (
                        <div>
                          <span className="text-gray-500">Education:</span>
                          <span className="ml-2 font-medium text-gray-900">{selectedJob.education}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Configure Matching Parameters (Simplified) */}
              {selectedJob && (
                <div>
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-semibold mr-3">
                      2
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Configure Matching Parameters</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Top Matches
                        </label>
                        <input
                          type="number"
                          value={matchConfig.topN}
                          onChange={(e) => setMatchConfig({ ...matchConfig, topN: Number(e.target.value) })}
                          min="1"
                          max="100"
                          className="input w-full"
                          disabled={isMutating}
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of best matches to return (1-100)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AI Insights
                        </label>
                        <input
                          type="number"
                          value={matchConfig.insightsTopK}
                          onChange={(e) => setMatchConfig({ ...matchConfig, insightsTopK: Number(e.target.value) })}
                          min="0"
                          max="20"
                          className="input w-full"
                          disabled={isMutating}
                        />
                        <p className="text-xs text-gray-500 mt-1">Detailed insights for top K matches (0-20)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleStartMatch}
                  disabled={!selectedJobId || isMutating}
                  size="lg"
                  className="w-full"
                >
                  {isMutating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start AI Matching
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500 mt-3">
                  This may take 1-2 minutes depending on the number of resumes
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Analysis</h3>
          <p className="text-sm text-gray-600">
            Advanced machine learning algorithms analyze skills, experience, and cultural fit to find the perfect match
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lightning Fast</h3>
          <p className="text-sm text-gray-600">
            Process hundreds of resumes in seconds with our optimized matching engine and asynchronous processing
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Detailed Insights</h3>
          <p className="text-sm text-gray-600">
            Get comprehensive scoring breakdown and AI-generated explanations for each candidate match
          </p>
        </Card>
      </div>

      {/* Match Progress Modal */}
      {matchQueueId && (
        <MatchProgressModal
          isOpen={isModalOpen('match-progress')}
          queueId={matchQueueId}
          jobId={selectedJobId}
          onClose={() => {
            closeModal('match-progress');
            setMatchQueueId(null);
          }}
        />
      )}
    </div>
  );
}
