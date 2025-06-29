import React from 'react';
import { MessageSquare, User, Users } from 'lucide-react';

export type ScrapingMode = 'post_comments' | 'profile_details' | 'mixed';

interface ScrapingModeSelectorProps {
  selectedMode: ScrapingMode;
  onModeChange: (mode: ScrapingMode) => void;
}

const modes = [
  {
    id: 'post_comments' as ScrapingMode,
    title: 'Scrape Post Commenters',
    description: 'Extract all users who commented on a LinkedIn post',
    icon: MessageSquare,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconColor: 'text-blue-600'
  },
  {
    id: 'profile_details' as ScrapingMode,
    title: 'Scrape Profile Details',
    description: 'Get detailed information from LinkedIn profiles',
    icon: User,
    color: 'bg-green-50 border-green-200 text-green-700',
    iconColor: 'text-green-600'
  },
  {
    id: 'mixed' as ScrapingMode,
    title: 'Mixed Scraper',
    description: 'Scrape post commenters and their full profile details',
    icon: Users,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    iconColor: 'text-purple-600'
  }
];

export function ScrapingModeSelector({ selectedMode, onModeChange }: ScrapingModeSelectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Scraping Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`
                relative p-4 rounded-lg border-2 text-left transition-all duration-200
                ${isSelected 
                  ? `${mode.color} border-current shadow-md transform scale-105` 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-6 w-6 mt-1 ${isSelected ? mode.iconColor : 'text-gray-500'}`} />
                <div>
                  <h3 className={`font-medium ${isSelected ? 'text-current' : 'text-gray-900'}`}>
                    {mode.title}
                  </h3>
                  <p className={`text-sm mt-1 ${isSelected ? 'text-current opacity-80' : 'text-gray-600'}`}>
                    {mode.description}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className={`w-3 h-3 rounded-full ${mode.iconColor.replace('text-', 'bg-')}`} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}