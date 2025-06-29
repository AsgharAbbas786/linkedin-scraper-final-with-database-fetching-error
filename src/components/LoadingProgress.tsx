import React from 'react';
import { Loader2, CheckCircle, AlertCircle, MessageSquare, User, Users } from 'lucide-react';

interface LoadingProgressProps {
  type: 'post_comments' | 'profile_details' | 'mixed';
  stage: 'starting' | 'scraping_comments' | 'extracting_profiles' | 'scraping_profiles' | 'saving_data' | 'completed' | 'error';
  progress?: number;
  message?: string;
  error?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  type,
  stage,
  progress = 0,
  message,
  error
}) => {
  const getIcon = () => {
    switch (type) {
      case 'post_comments':
        return <MessageSquare className="w-6 h-6 text-blue-600" />;
      case 'profile_details':
        return <User className="w-6 h-6 text-green-600" />;
      case 'mixed':
        return <Users className="w-6 h-6 text-purple-600" />;
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'post_comments':
        return 'Scraping Post Comments';
      case 'profile_details':
        return 'Scraping Profile Details';
      case 'mixed':
        return 'Mixed Scraping (Comments + Profiles)';
    }
  };

  const getStageMessage = () => {
    if (error) return error;
    if (message) return message;
    
    switch (stage) {
      case 'starting':
        return 'Initializing scraping process...';
      case 'scraping_comments':
        return 'Extracting comments from LinkedIn post...';
      case 'extracting_profiles':
        return 'Extracting profile URLs from comments...';
      case 'scraping_profiles':
        return 'Gathering detailed profile information...';
      case 'saving_data':
        return 'Saving data to database...';
      case 'completed':
        return 'Scraping completed successfully!';
      case 'error':
        return 'An error occurred during scraping';
      default:
        return 'Processing...';
    }
  };

  const getProgressColor = () => {
    if (error || stage === 'error') return 'bg-red-500';
    if (stage === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getBorderColor = () => {
    if (error || stage === 'error') return 'border-red-200 bg-red-50';
    if (stage === 'completed') return 'border-green-200 bg-green-50';
    return 'border-blue-200 bg-blue-50';
  };

  const stages = [
    { key: 'starting', label: 'Initialize' },
    ...(type === 'post_comments' || type === 'mixed' ? [{ key: 'scraping_comments', label: 'Extract Comments' }] : []),
    ...(type === 'mixed' ? [{ key: 'extracting_profiles', label: 'Extract Profiles' }] : []),
    ...(type === 'profile_details' || type === 'mixed' ? [{ key: 'scraping_profiles', label: 'Scrape Profiles' }] : []),
    { key: 'saving_data', label: 'Save Data' },
    { key: 'completed', label: 'Complete' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);
  const progressPercentage = stage === 'completed' ? 100 : Math.max(progress, (currentStageIndex / (stages.length - 1)) * 100);

  return (
    <div className={`rounded-xl border-2 p-6 ${getBorderColor()}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white rounded-lg shadow-sm">
          {stage === 'completed' ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : stage === 'error' || error ? (
            <AlertCircle className="w-6 h-6 text-red-600" />
          ) : (
            <div className="relative">
              {getIcon()}
              <Loader2 className="w-4 h-4 absolute -top-1 -right-1 animate-spin text-gray-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {getTypeTitle()}
          </h3>
          <p className="text-gray-600">
            {getStageMessage()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="flex justify-between items-center">
        {stages.map((stageItem, index) => {
          const isCompleted = index < currentStageIndex || stage === 'completed';
          const isCurrent = index === currentStageIndex && stage !== 'completed';
          const isError = stage === 'error' && index === currentStageIndex;
          
          return (
            <div key={stageItem.key} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                isError 
                  ? 'bg-red-500 text-white' 
                  : isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
              }`}>
                {isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-xs text-center ${
                isError ? 'text-red-600' : isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {stageItem.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};