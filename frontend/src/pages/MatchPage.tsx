import { useEffect, useState } from 'react';
import { useJobStore } from '../state/jobStore';
import { useMatchingStore } from '../state/matchingStore';
import type { Job } from '../api/types';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/components/Button';
import { toast } from '../utils/toast';

export default function MatchPage() {
  const { jobs, isLoading, error: jobError, fetchJobs, clearError: clearJobError } = useJobStore();
  const { isMutating, error: matchError, enqueueMatch, clearError: clearMatchError } = useMatchingStore();
  const [selected, setSelected] = useState<string>('');
  const [topN, setTopN] = useState<number>(10);
  const [insightsTopK, setInsightsTopK] = useState<number>(5);
  const nav = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (jobError) {
      toast.error(jobError);
      clearJobError();
    }
  }, [jobError, clearJobError]);

  useEffect(() => {
    if (matchError) {
      toast.error(matchError);
      clearMatchError();
    }
  }, [matchError, clearMatchError]);

  const selectedJob = jobs.find(j => j.id === selected);

  async function onMatch() {
    if (!selected) {
      toast.warning('Please select a job first');
      return;
    }

    try {
      const queueId = await enqueueMatch(selected, { topN, insightsTopK });
      toast.success('Matching queued successfully!');
      nav(`/results/${selected}?queueId=${queueId}`);
    } catch (error) {
      console.error('Matching failed:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading jobs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">AI Resume Matching</h1>
        <p className="text-gray-600 mt-2">
          Select a job position and configure matching parameters to find the best candidates
        </p>
      </div>

      {/* Main Matching Card */}
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <div className="space-y-6">
            {/* Job Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job Position
              </label>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="select w-full"
                disabled={isMutating}
              >
                <option value="">Choose a job position...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.skills.length} skills required)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Job Preview */}
            {selectedJob && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-medium text-gray-900 mb-2">{selectedJob.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedJob.description}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map(skill => (
                    <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Experience: {selectedJob.experience || 'Not specified'} years •
                  Education: {selectedJob.education || 'Not specified'}
                </div>
              </div>
            )}

            {/* Matching Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Top Matches
                </label>
                <input
                  type="number"
                  value={topN}
                  onChange={e => setTopN(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="input"
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
                  value={insightsTopK}
                  onChange={e => setInsightsTopK(Number(e.target.value))}
                  min="0"
                  max="20"
                  className="input"
                  disabled={isMutating}
                />
                <p className="text-xs text-gray-500 mt-1">Detailed insights for top K matches (0-20)</p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={onMatch}
              disabled={!selected || isMutating}
              loading={isMutating}
              className="w-full"
              size="lg"
            >
              {isMutating ? 'Processing...' : 'Start AI Matching'}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered</h3>
          <p className="text-sm text-gray-600">
            Advanced machine learning algorithms analyze skills, experience, and cultural fit
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Lightning Fast</h3>
          <p className="text-sm text-gray-600">
            Process hundreds of resumes in seconds with our optimized matching engine
          </p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Detailed Insights</h3>
          <p className="text-sm text-gray-600">
            Get comprehensive scoring and explanations for each candidate match
          </p>
        </div>
      </div>
    </div>
  );
}


