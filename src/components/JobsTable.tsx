import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, StopCircle, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  job_type: string;
  input_url: string;
  status: string | null;
  results_count: number | null;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
}

interface JobsTableProps {
  jobs: Job[];
  onCancelJob?: (jobId: string) => Promise<void>;
  onViewJobProgress?: (jobId: string) => void;
}

export const JobsTable: React.FC<JobsTableProps> = ({ 
  jobs, 
  onCancelJob,
  onViewJobProgress 
}) => {
  const [cancellingJobs, setCancellingJobs] = useState<Set<string>>(new Set());

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <StopCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-medium rounded-full";
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'running':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const formatJobType = (jobType: string) => {
    switch (jobType) {
      case 'post_comments':
        return 'Post Comments';
      case 'profile_details':
        return 'Profile Details';
      case 'mixed':
        return 'Mixed (Post + Profiles)';
      default:
        return jobType;
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!onCancelJob) return;
    
    if (!confirm('Are you sure you want to cancel this job? This action cannot be undone.')) {
      return;
    }

    setCancellingJobs(prev => new Set(prev).add(jobId));
    
    try {
      await onCancelJob(jobId);
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('Failed to cancel job. Please try again.');
    } finally {
      setCancellingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const canCancelJob = (status: string | null) => {
    return status === 'running' || status === 'pending';
  };

  const getJobDuration = (createdAt: string | null, completedAt: string | null) => {
    if (!createdAt) return '-';
    
    const start = new Date(createdAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Scraping Jobs ({jobs.length})</h3>
          
          {jobs.some(job => job.status === 'running') && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                {jobs.filter(job => job.status === 'running').length} job(s) running
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Results
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className={getStatusBadge(job.status)}>
                      {job.status || 'pending'}
                    </span>
                  </div>
                  {job.error_message && (
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1" title={job.error_message}>
                      <AlertTriangle className="w-3 h-3" />
                      Error: {job.error_message.substring(0, 50)}...
                    </div>
                  )}
                  {job.status === 'running' && (
                    <div className="text-xs text-blue-600 mt-1">
                      Processing... ({getJobDuration(job.created_at, null)})
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatJobType(job.job_type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <a
                      href={job.input_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                      title={job.input_url}
                    >
                      {job.input_url}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {job.results_count !== null ? job.results_count.toLocaleString() : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {getJobDuration(job.created_at, job.completed_at)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {job.created_at ? new Date(job.created_at).toLocaleString() : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {job.status === 'running' && onViewJobProgress && (
                      <button
                        onClick={() => onViewJobProgress(job.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="View progress"
                      >
                        <Eye className="w-3 h-3" />
                        Progress
                      </button>
                    )}
                    
                    {canCancelJob(job.status) && onCancelJob && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        disabled={cancellingJobs.has(job.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Cancel job"
                      >
                        {cancellingJobs.has(job.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <StopCircle className="w-3 h-3" />
                        )}
                        {cancellingJobs.has(job.id) ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No scraping jobs yet</div>
        </div>
      )}
    </div>
  );
};