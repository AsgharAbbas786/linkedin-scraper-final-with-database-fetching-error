import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ProgressIndicatorProps {
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentStep: string;
  progress?: number;
}

export function ProgressIndicator({ status, currentStep, progress }: ProgressIndicatorProps) {
  if (status === 'idle') return null;

  const getIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium text-gray-900">{currentStep}</p>
          {progress !== undefined && status === 'running' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}