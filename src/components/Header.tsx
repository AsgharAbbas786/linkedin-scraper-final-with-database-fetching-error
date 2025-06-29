import React from 'react';
import { LinkedinIcon, Settings, BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LinkedinIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Antense LinkedIn Scraper</h1>
              <p className="text-sm text-gray-500">Professional LinkedIn Data Extraction</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}