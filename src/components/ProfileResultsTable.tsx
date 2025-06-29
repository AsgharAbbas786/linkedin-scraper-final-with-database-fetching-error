import React, { useState, useMemo } from 'react';
import { 
  User, MapPin, Users, Briefcase, GraduationCap, Award, 
  Eye, EyeOff, Filter, Download, RefreshCw, ExternalLink,
  Mail, Phone, Building, Calendar, Star, X, ChevronDown,
  CheckSquare, Square, Save, Tag, Plus
} from 'lucide-react';

interface ProfileResultsTableProps {
  profiles: any[];
  onViewDetails: (profile: any) => void;
  onUpdateProfile?: (profileUrl: string) => Promise<void>;
  onExport?: (format: string) => void;
  onStoreSelectedProfiles?: (profiles: any[], tags: string[]) => Promise<void>;
  isUpdating?: boolean;
  showActions?: boolean;
  showStoreOption?: boolean;
}

export const ProfileResultsTable: React.FC<ProfileResultsTableProps> = ({
  profiles,
  onViewDetails,
  onUpdateProfile,
  onExport,
  onStoreSelectedProfiles,
  isUpdating = false,
  showActions = true,
  showStoreOption = false
}) => {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['select', 'picture', 'name', 'headline', 'location', 'connections', 'company', 'actions'])
  );
  const [filter, setFilter] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeTags, setStoreTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isStoring, setIsStoring] = useState(false);
  
  // Data filters
  const [dataFilters, setDataFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasWebsite: false,
    hasSkills: false,
    hasExperience: false,
    hasEducation: false,
    hasCertifications: false,
    hasAbout: false,
    hasLocation: false,
    hasCurrentJob: false
  });
  const [showDataFilters, setShowDataFilters] = useState(false);

  const allColumns = [
    { key: 'select', label: 'Select' },
    { key: 'picture', label: 'Picture' },
    { key: 'name', label: 'Name' },
    { key: 'headline', label: 'Headline' },
    { key: 'location', label: 'Location' },
    { key: 'connections', label: 'Connections' },
    { key: 'followers', label: 'Followers' },
    { key: 'company', label: 'Current Company' },
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'industry', label: 'Industry' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Top Skills' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'duration', label: 'Current Role Duration' },
    { key: 'website', label: 'Website' },
    { key: 'actions', label: 'Actions' }
  ];

  // Remove duplicates based on LinkedIn URL
  const uniqueProfiles = useMemo(() => {
    const seen = new Set();
    return profiles.filter(profile => {
      const url = profile.linkedinUrl || profile.linkedin_url;
      if (seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    let filtered = uniqueProfiles;
    
    // Apply text filter
    if (filter) {
      filtered = filtered.filter(profile => {
        const searchText = `${profile.fullName || ''} ${profile.headline || ''} ${profile.addressWithCountry || ''} ${profile.companyName || ''}`.toLowerCase();
        return searchText.includes(filter.toLowerCase());
      });
    }
    
    // Apply data presence filters
    filtered = filtered.filter(profile => {
      if (dataFilters.hasEmail && !profile.email) return false;
      if (dataFilters.hasPhone && !profile.mobileNumber) return false;
      if (dataFilters.hasWebsite && !profile.creatorWebsite?.link) return false;
      if (dataFilters.hasSkills && (!profile.skills || profile.skills.length === 0)) return false;
      if (dataFilters.hasExperience && (!profile.experiences || profile.experiences.length === 0)) return false;
      if (dataFilters.hasEducation && (!profile.educations || profile.educations.length === 0)) return false;
      if (dataFilters.hasCertifications && (!profile.licenseAndCertificates || profile.licenseAndCertificates.length === 0)) return false;
      if (dataFilters.hasAbout && !profile.about) return false;
      if (dataFilters.hasLocation && !profile.addressWithCountry && !profile.addressCountryOnly && !profile.addressWithoutCountry) return false;
      if (dataFilters.hasCurrentJob && !profile.jobTitle && !profile.companyName) return false;
      
      return true;
    });
    
    return filtered;
  }, [uniqueProfiles, filter, dataFilters]);

  const toggleColumn = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const toggleDataFilter = (filterKey: keyof typeof dataFilters) => {
    setDataFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  const clearAllDataFilters = () => {
    setDataFilters({
      hasEmail: false,
      hasPhone: false,
      hasWebsite: false,
      hasSkills: false,
      hasExperience: false,
      hasEducation: false,
      hasCertifications: false,
      hasAbout: false,
      hasLocation: false,
      hasCurrentJob: false
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(dataFilters).filter(Boolean).length;
  };

  const toggleProfileSelection = (profileUrl: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileUrl)) {
      newSelected.delete(profileUrl);
    } else {
      newSelected.add(profileUrl);
    }
    setSelectedProfiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.size === filteredProfiles.length) {
      setSelectedProfiles(new Set());
    } else {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.linkedinUrl)));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !storeTags.includes(newTag.trim())) {
      setStoreTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setStoreTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleStoreProfiles = async () => {
    if (selectedProfiles.size === 0) return;
    
    setIsStoring(true);
    try {
      const profilesToStore = filteredProfiles.filter(p => selectedProfiles.has(p.linkedinUrl));
      if (onStoreSelectedProfiles) {
        await onStoreSelectedProfiles(profilesToStore, storeTags);
      }
      setShowStoreModal(false);
      setSelectedProfiles(new Set());
      setStoreTags([]);
    } catch (error) {
      console.error('Error storing profiles:', error);
    } finally {
      setIsStoring(false);
    }
  };

  const renderCell = (profile: any, columnKey: string) => {
    switch (columnKey) {
      case 'select':
        return (
          <button
            onClick={() => toggleProfileSelection(profile.linkedinUrl)}
            className="text-blue-600 hover:text-blue-800"
          >
            {selectedProfiles.has(profile.linkedinUrl) ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
        );

      case 'picture':
        return (
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profile.profilePic ? (
              <img 
                src={profile.profilePic} 
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
        );
      
      case 'name':
        return (
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()}
            </div>
            <div className="text-sm text-blue-600 hover:underline">
              <a 
                href={profile.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                LinkedIn Profile
              </a>
            </div>
          </div>
        );
      
      case 'headline':
        return (
          <div className="max-w-xs">
            <div 
              className="text-sm text-gray-900 line-clamp-2" 
              title={profile.headline}
            >
              {profile.headline || 'No headline'}
            </div>
          </div>
        );
      
      case 'location':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {profile.addressWithCountry || profile.addressCountryOnly || 'Not specified'}
            </span>
          </div>
        );
      
      case 'connections':
        return (
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {profile.connections?.toLocaleString() || '0'}
            </span>
          </div>
        );
      
      case 'followers':
        return (
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-green-600" />
            <span className="font-medium">
              {profile.followers?.toLocaleString() || '0'}
            </span>
          </div>
        );
      
      case 'company':
        return (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {profile.companyName || 'Not specified'}
              </div>
              {profile.companySize && (
                <div className="text-xs text-gray-500">
                  {profile.companySize} employees
                </div>
              )}
            </div>
          </div>
        );
      
      case 'jobTitle':
        return (
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 truncate">
              {profile.jobTitle || 'Not specified'}
            </span>
          </div>
        );
      
      case 'industry':
        return (
          <span className="text-sm text-gray-600">
            {profile.companyIndustry || 'Not specified'}
          </span>
        );
      
      case 'experience':
        return (
          <div className="text-sm text-gray-600">
            {profile.experiences?.length || 0} positions
          </div>
        );
      
      case 'education':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>{profile.educations?.length || 0} schools</span>
          </div>
        );
      
      case 'skills':
        return (
          <div className="max-w-xs">
            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {profile.skills.slice(0, 3).map((skill: any, idx: number) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {skill.title}
                  </span>
                ))}
                {profile.skills.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{profile.skills.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No skills listed</span>
            )}
          </div>
        );
      
      case 'email':
        return profile.email ? (
          <a 
            href={`mailto:${profile.email}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Mail className="w-4 h-4" />
            {profile.email}
          </a>
        ) : (
          <span className="text-sm text-gray-500">Not available</span>
        );
      
      case 'phone':
        return profile.mobileNumber ? (
          <a 
            href={`tel:${profile.mobileNumber}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Phone className="w-4 h-4" />
            {profile.mobileNumber}
          </a>
        ) : (
          <span className="text-sm text-gray-500">Not available</span>
        );
      
      case 'duration':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{profile.currentJobDuration || 'Not specified'}</span>
          </div>
        );
      
      case 'website':
        return profile.creatorWebsite?.link ? (
          <a 
            href={profile.creatorWebsite.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            {profile.creatorWebsite.name || 'Website'}
          </a>
        ) : (
          <span className="text-sm text-gray-500">Not available</span>
        );
      
      case 'actions':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onViewDetails(profile)}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Details
            </button>
            
            {showActions && onUpdateProfile && (
              <button
                onClick={() => onUpdateProfile(profile.linkedinUrl)}
                disabled={isUpdating}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                Update
              </button>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900">
            Profile Results ({filteredProfiles.length})
            {selectedProfiles.size > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">
                ({selectedProfiles.size} selected)
              </span>
            )}
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 text-sm font-normal text-green-600">
                ({getActiveFiltersCount()} filters active)
              </span>
            )}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Filter profiles..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Data Filters Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDataFilters(!showDataFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  getActiveFiltersCount() > 0 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Data Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showDataFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showDataFilters && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Show profiles with:</h4>
                    <button
                      onClick={clearAllDataFilters}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { key: 'hasEmail', label: 'Email address', icon: Mail },
                      { key: 'hasPhone', label: 'Phone number', icon: Phone },
                      { key: 'hasWebsite', label: 'Website', icon: ExternalLink },
                      { key: 'hasLocation', label: 'Location', icon: MapPin },
                      { key: 'hasCurrentJob', label: 'Current job', icon: Briefcase },
                      { key: 'hasAbout', label: 'About section', icon: Users },
                      { key: 'hasSkills', label: 'Skills', icon: Award },
                      { key: 'hasExperience', label: 'Experience', icon: Briefcase },
                      { key: 'hasEducation', label: 'Education', icon: GraduationCap },
                      { key: 'hasCertifications', label: 'Certifications', icon: Award }
                    ].map(({ key, label, icon: Icon }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={dataFilters[key as keyof typeof dataFilters]}
                          onChange={() => toggleDataFilter(key as keyof typeof dataFilters)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {onExport && (
              <select
                onChange={(e) => onExport(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue=""
              >
                <option value="" disabled>Export as...</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel</option>
              </select>
            )}
          </div>
        </div>

        {/* Selection and Store Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            
            <span className="text-sm text-gray-600">
              {selectedProfiles.size} of {filteredProfiles.length} selected
            </span>
          </div>

          {showStoreOption && selectedProfiles.size > 0 && (
            <button
              onClick={() => setShowStoreModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Store Selected Profiles ({selectedProfiles.size})
            </button>
          )}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {allColumns.map(column => (
              <button
                key={column.key}
                onClick={() => toggleColumn(column.key)}
                className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${
                  visibleColumns.has(column.key)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {visibleColumns.has(column.key) ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {column.label}
                {visibleColumns.has(column.key) && column.key !== 'actions' && column.key !== 'select' && (
                  <X className="w-3 h-3 ml-1 hover:text-red-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {allColumns
                .filter(column => visibleColumns.has(column.key))
                .map(column => (
                  <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProfiles.map((profile, index) => (
              <tr key={profile.linkedinUrl || index} className={`hover:bg-gray-50 ${selectedProfiles.has(profile.linkedinUrl) ? 'bg-blue-50' : ''}`}>
                {allColumns
                  .filter(column => visibleColumns.has(column.key))
                  .map(column => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      {renderCell(profile, column.key)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">
            {getActiveFiltersCount() > 0 ? 'No profiles match the selected filters' : 'No profiles found'}
          </div>
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearAllDataFilters}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Store Profiles Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Store {selectedProfiles.size} Profiles
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Tags (optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Enter tag name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {storeTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {storeTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowStoreModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStoreProfiles}
                disabled={isStoring}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isStoring ? 'Storing...' : 'Store Profiles'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};