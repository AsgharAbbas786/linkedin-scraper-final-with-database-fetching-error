import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface JobProgressModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onCancelJob?: (jobId: string) => Promise<void>;
}

interface JobProgress {
  id: string;
  job_type: string;
  input_url: string;
  status: string;
  results_count: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export const JobProgressModal: React.FC<JobProgressModalProps> = ({
  jobId,
  isOpen,
  onClose,
  onCancelJob
}) => {
  const [job, setJob] = useState<JobProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobProgress();
      const interval = setInterval(loadJobProgress, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, jobId]);

  const loadJobProgress = async () => {
    try {
      // In a real implementation, you would fetch from your API
      // For now, we'll simulate the job progress
      const mockJob: JobProgress = {
        id: jobId,
        job_type: 'profile_details',
        input_url: 'https://linkedin.com/in/example',
        status: 'running',
        results_count: null,
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: null
      };
      
      setJob(mockJob);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading job progress:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancelJob || !job) return;
    
    if (!confirm('Are you sure you want to cancel this job?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await onCancelJob(job.id);
      onClose();
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('Failed to cancel job. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getEstimatedTimeRemaining = () => {
    if (!job || job.status !== 'running') return null;
    
    const elapsed = Date.now() - new Date(job.created_at).getTime();
    const elapsedMinutes = Math.floor(elapsed / 60000);
    
    // Rough estimates based on job type
    const estimates = {
      'post_comments': 2, // 2 minutes
      'profile_details': 5, // 5 minutes
      'mixed': 10 // 10 minutes
    };
    
    const estimated = estimates[job.job_type as keyof typeof estimates] || 5;
    const remaining = Math.max(0, estimated - elapsedMinutes);
    
    return remaining;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Job Progress</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <div className="text-gray-600">Loading job details...</div>
          </div>
        ) : job ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(job.status)}
              <div>
                <div className="font-medium text-gray-900">
                  {job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {job.status}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">Target URL:</div>
              <div className="text-sm text-gray-900 break-all">{job.input_url}</div>
            </div>

            {job.status === 'running' && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Current Phase:</div>
                  <div>Saving data to database...</div>
                  {getEstimatedTimeRemaining() !== null && (
                    <div className="text-xs mt-2">
                      Estimated time remaining: ~{getEstimatedTimeRemaining()} minutes
                    </div>
                  )}
                </div>
              </div>
            )}

            {job.results_count !== null && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <div className="font-medium">Results: {job.results_count}</div>
                </div>
              </div>
            )}

            {job.error_message && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-sm text-red-800">
                  <div className="font-medium mb-1">Error:</div>
                  <div>{job.error_message}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Close
              </button>
              
              {job.status === 'running' && onCancelJob && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Job'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Job not found
          </div>
        )}
      </div>
    </div>
  );
};