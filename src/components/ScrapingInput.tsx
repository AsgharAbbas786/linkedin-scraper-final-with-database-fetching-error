import React, { useState } from 'react';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { validateLinkedInUrl } from '../lib/utils';
import type { ScrapingMode } from './ScrapingModeSelector';

interface ScrapingInputProps {
  mode: ScrapingMode;
  onScrape: (url: string) => Promise<void>;
  isLoading: boolean;
}

export function ScrapingInput({ mode, onScrape, isLoading }: ScrapingInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const getPlaceholder = () => {
    switch (mode) {
      case 'post_comments':
        return 'https://www.linkedin.com/posts/microsoft-events_microsoft-build...';
      case 'profile_details':
        return 'https://www.linkedin.com/in/username or multiple URLs (one per line)';
      case 'mixed':
        return 'https://www.linkedin.com/posts/microsoft-events_microsoft-build...';
      default:
        return 'Enter LinkedIn URL';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'post_comments':
        return 'Enter a LinkedIn post URL to extract all commenters';
      case 'profile_details':
        return 'Enter LinkedIn profile URLs to extract detailed information';
      case 'mixed':
        return 'Enter a LinkedIn post URL to extract commenters and their full profiles';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a LinkedIn URL');
      return;
    }

    // For profile details mode, allow multiple URLs
    if (mode === 'profile_details') {
      const urls = url.split('\n').map(u => u.trim()).filter(Boolean);
      const invalidUrls = urls.filter(u => !validateLinkedInUrl(u));
      
      if (invalidUrls.length > 0) {
        setError(`Invalid LinkedIn URLs: ${invalidUrls.join(', ')}`);
        return;
      }
    } else {
      if (!validateLinkedInUrl(url.trim())) {
        setError('Please enter a valid LinkedIn URL');
        return;
      }
    }

    try {
      await onScrape(url.trim());
      setUrl(''); // Clear input on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Input URL</h2>
        <p className="text-sm text-gray-600">{getDescription()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {mode === 'profile_details' ? (
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={getPlaceholder()}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isLoading}
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          )}
          
          {error && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span>Start Scraping</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}