import React, { useState } from 'react';
import { Search, Users, UserCheck, Loader2, AlertTriangle } from 'lucide-react';

interface ScrapingFormProps {
  onScrape: (type: 'post_comments' | 'profile_details' | 'mixed', url: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export const ScrapingForm: React.FC<ScrapingFormProps> = ({ onScrape, isLoading, disabled = false }) => {
  const [scrapingType, setScrapingType] = useState<'post_comments' | 'profile_details' | 'mixed'>('post_comments');
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || disabled) return;
    
    await onScrape(scrapingType, url.trim());
    setUrl('');
  };

  const getPlaceholder = () => {
    switch (scrapingType) {
      case 'post_comments':
        return 'https://www.linkedin.com/posts/...';
      case 'profile_details':
        return 'https://www.linkedin.com/in/username';
      case 'mixed':
        return 'https://www.linkedin.com/posts/... (will scrape post + profiles)';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (scrapingType) {
      case 'post_comments':
        return <Search className="w-5 h-5" />;
      case 'profile_details':
        return <UserCheck className="w-5 h-5" />;
      case 'mixed':
        return <Users className="w-5 h-5" />;
      default:
        return <Search className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          {getIcon()}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">LinkedIn Scraper</h2>
      </div>

      {disabled && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Setup Required</p>
            <p>Please select a user and configure an Apify API key before starting to scrape.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Scraping Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setScrapingType('post_comments')}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                scrapingType === 'post_comments'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Search className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Post Comments</div>
              <div className="text-sm text-gray-500">Scrape post engagers</div>
            </button>

            <button
              type="button"
              onClick={() => setScrapingType('profile_details')}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                scrapingType === 'profile_details'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <UserCheck className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Profile Details</div>
              <div className="text-sm text-gray-500">Scrape profile info</div>
            </button>

            <button
              type="button"
              onClick={() => setScrapingType('mixed')}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                scrapingType === 'mixed'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Mixed</div>
              <div className="text-sm text-gray-500">Post + Profiles</div>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim() || disabled}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              {getIcon()}
              Start Scraping
            </>
          )}
        </button>
      </form>
    </div>
  );
};