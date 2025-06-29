import React, { useState } from 'react';
import { MessageSquare, User, CheckSquare, Square, Users, ArrowLeft } from 'lucide-react';
import { LoadingProgress } from './LoadingProgress';

interface CommentData {
  type: string;
  id: string;
  linkedinUrl: string;
  commentary: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    linkedinUrl: string;
    position: string;
    pictureUrl: string;
  };
}

interface CommentResultsProps {
  comments: CommentData[];
  onScrapeSelectedProfiles: (profileUrls: string[]) => Promise<void>;
  isLoading: boolean;
  onBack: () => void;
  loadingStage?: 'starting' | 'scraping_comments' | 'extracting_profiles' | 'scraping_profiles' | 'saving_data' | 'completed' | 'error';
  loadingProgress?: number;
  loadingMessage?: string;
  loadingError?: string;
}

export const CommentResults: React.FC<CommentResultsProps> = ({
  comments,
  onScrapeSelectedProfiles,
  isLoading,
  onBack,
  loadingStage = 'starting',
  loadingProgress = 0,
  loadingMessage = '',
  loadingError = ''
}) => {
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());

  const toggleComment = (commentId: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(commentId)) {
      newSelected.delete(commentId);
    } else {
      newSelected.add(commentId);
    }
    setSelectedComments(newSelected);
  };

  const toggleAll = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c.id)));
    }
  };

  const handleScrapeSelected = async () => {
    const selectedProfileUrls = comments
      .filter(comment => selectedComments.has(comment.id))
      .map(comment => comment.actor.linkedinUrl)
      .filter(Boolean);
    
    if (selectedProfileUrls.length > 0) {
      await onScrapeSelectedProfiles(selectedProfileUrls);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays <= 7) {
      return 'This week';
    } else if (diffDays <= 30) {
      return 'This month';
    } else {
      return date.toLocaleDateString('en-GB');
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading Progress */}
      {isLoading && (
        <LoadingProgress
          type="profile_details"
          stage={loadingStage}
          progress={loadingProgress}
          message={loadingMessage}
          error={loadingError}
        />
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Post Comments ({comments.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Select commenters to scrape their profile details
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Scraper
              </button>
              
              <button
                onClick={handleScrapeSelected}
                disabled={selectedComments.size === 0 || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {isLoading ? 'Scraping...' : `Scrape Selected Profiles (${selectedComments.size})`}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={toggleAll}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {selectedComments.size === comments.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedComments.size === comments.length ? 'Deselect All' : 'Select All'}
            </button>
            
            <span className="text-sm text-gray-600">
              {selectedComments.size} of {comments.length} selected
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commenter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleComment(comment.id)}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {selectedComments.has(comment.id) ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                        {comment.actor.pictureUrl ? (
                          <img 
                            src={comment.actor.pictureUrl} 
                            alt={comment.actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {comment.actor.name}
                        </div>
                        <div className="text-sm text-blue-600 hover:underline">
                          <a 
                            href={comment.actor.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {comment.actor.position || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md">
                      <div className="line-clamp-3" title={comment.commentary}>
                        {comment.commentary}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {comments.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">No comments found</div>
          </div>
        )}
      </div>
    </div>
  );
};