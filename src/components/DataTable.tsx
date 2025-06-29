import React, { useState, useMemo } from 'react';
import { 
  X, Download, RefreshCw, Eye, EyeOff, Filter, Calendar, ExternalLink,
  CheckSquare, Square, Trash2, Users, Upload, MapPin, Building, Briefcase,
  GraduationCap, Award, Mail, Phone, Globe, ChevronDown, Tag
} from 'lucide-react';

interface Profile {
  id: string;
  linkedin_url: string;
  profile_data: any;
  last_updated: string | null;
  created_at: string | null;
  tags?: string[];
}

interface DataTableProps {
  profiles: Profile[];
  onUpdateProfile: (profileUrl: string) => Promise<void>;
  onUpdateSelectedProfiles?: (profileUrls: string[]) => Promise<void>;
  onDeleteSelectedProfiles?: (profileIds: string[]) => Promise<void>;
  onExport: (format: string, selectedOnly?: boolean) => void;
  onViewDetails?: (profile: any) => void;
  isUpdating: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  profiles,
  onUpdateProfile,
  onUpdateSelectedProfiles,
  onDeleteSelectedProfiles,
  onExport,
  onViewDetails,
  isUpdating
}) => {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['select', 'picture', 'name', 'headline', 'location', 'connections', 'company', 'tags', 'updated', 'actions'])
  );
  const [filter, setFilter] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [updatingProfiles, setUpdatingProfiles] = useState<Set<string>>(new Set());
  
  // New filtering options
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
    { key: 'duration', label: 'Current Role Duration' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Top Skills' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
    { key: 'tags', label: 'Tags' },
    { key: 'updated', label: 'Last Updated' },
    { key: 'actions', label: 'Actions' }
  ];

  // Remove duplicates based on LinkedIn URL
  const uniqueProfiles = useMemo(() => {
    const seen = new Set();
    return profiles.filter(profile => {
      const url = profile.linkedin_url;
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
        const data = profile.profile_data || {};
        const tags = profile.tags || [];
        const searchText = `${data.fullName || data.firstName || ''} ${data.lastName || ''} ${data.headline || ''} ${data.addressWithCountry || ''} ${data.companyName || ''} ${tags.join(' ')}`.toLowerCase();
        return searchText.includes(filter.toLowerCase());
      });
    }
    
    // Apply data presence filters
    filtered = filtered.filter(profile => {
      const data = profile.profile_data || {};
      
      if (dataFilters.hasEmail && !data.email) return false;
      if (dataFilters.hasPhone && !data.mobileNumber) return false;
      if (dataFilters.hasWebsite && !data.creatorWebsite?.link) return false;
      if (dataFilters.hasSkills && (!data.skills || data.skills.length === 0)) return false;
      if (dataFilters.hasExperience && (!data.experiences || data.experiences.length === 0)) return false;
      if (dataFilters.hasEducation && (!data.educations || data.educations.length === 0)) return false;
      if (dataFilters.hasCertifications && (!data.licenseAndCertificates || data.licenseAndCertificates.length === 0)) return false;
      if (dataFilters.hasAbout && !data.about) return false;
      if (dataFilters.hasLocation && !data.addressWithCountry && !data.addressCountryOnly && !data.addressWithoutCountry) return false;
      if (dataFilters.hasCurrentJob && !data.jobTitle && !data.companyName) return false;
      
      return true;
    });
    
    return filtered;
  }, [uniqueProfiles, filter, dataFilters]);

  const toggleColumn = (columnKey: string) => {
    if (columnKey === 'select' || columnKey === 'actions') return; // Don't allow hiding these
    
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

  const toggleProfileSelection = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedProfiles.size === filteredProfiles.length) {
      setSelectedProfiles(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  const handleSingleProfileUpdate = async (profileUrl: string, profileId: string) => {
    setUpdatingProfiles(prev => new Set(prev).add(profileId));
    
    try {
      await onUpdateProfile(profileUrl);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdatingProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  };

  const handleBulkUpdate = async () => {
    if (onUpdateSelectedProfiles && selectedProfiles.size > 0) {
      const selectedUrls = filteredProfiles
        .filter(p => selectedProfiles.has(p.id))
        .map(p => p.linkedin_url);
      
      await onUpdateSelectedProfiles(selectedUrls);
      setSelectedProfiles(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (onDeleteSelectedProfiles && selectedProfiles.size > 0) {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${selectedProfiles.size} selected profiles? This action cannot be undone.`
      );
      
      if (confirmed) {
        await onDeleteSelectedProfiles(Array.from(selectedProfiles));
        setSelectedProfiles(new Set());
        setShowBulkActions(false);
      }
    }
  };

  const handleBulkExport = (format: string) => {
    onExport(format, true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return { text: 'Never', color: 'text-gray-600 bg-gray-100 border-gray-200', exact: 'Never' };
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time to start of day for accurate comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const updateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - updateDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const exactDate = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    if (diffDays === 0) {
      return { text: 'Today', color: 'text-green-700 bg-green-100 border-green-200', exact: exactDate };
    } else if (diffDays <= 7) {
      return { text: 'This week', color: 'text-green-600 bg-green-50 border-green-200', exact: exactDate };
    } else if (diffDays <= 30) {
      return { text: 'This month', color: 'text-blue-600 bg-blue-50 border-blue-200', exact: exactDate };
    } else {
      return { text: exactDate, color: 'text-amber-700 bg-amber-100 border-amber-200', exact: exactDate };
    }
  };

  const renderCell = (profile: Profile, columnKey: string) => {
    const data = profile.profile_data || {};
    const isProfileUpdating = updatingProfiles.has(profile.id);
    
    switch (columnKey) {
      case 'select':
        return (
          <button
            onClick={() => toggleProfileSelection(profile.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            {selectedProfiles.has(profile.id) ? (
              <CheckSquare className="w-5 h-5" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
        );

      case 'picture':
        return (
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {data.profilePic || data.profilePicHighQuality ? (
              <img 
                src={data.profilePicHighQuality || data.profilePic} 
                alt={data.fullName || `${data.firstName} ${data.lastName}`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No Photo
              </div>
            )}
          </div>
        );
      
      case 'name':
        return (
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim()}
            </div>
            <div className="text-sm text-blue-600 hover:underline">
              <a href={profile.linkedin_url || data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                View Profile
              </a>
            </div>
          </div>
        );
      
      case 'headline':
        return (
          <div className="max-w-xs">
            <div 
              className="text-sm text-gray-900 line-clamp-2" 
              title={data.headline}
            >
              {data.headline || 'No headline'}
            </div>
          </div>
        );
      
      case 'location':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {data.addressWithCountry || data.addressCountryOnly || data.addressWithoutCountry || 'Not specified'}
            </span>
          </div>
        );
      
      case 'connections':
        return (
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium">
              {data.connections?.toLocaleString() || '0'}
            </span>
          </div>
        );
      
      case 'followers':
        return (
          <div className="flex items-center gap-1 text-sm">
            <Users className="w-4 h-4 text-green-600" />
            <span className="font-medium">
              {data.followers?.toLocaleString() || '0'}
            </span>
          </div>
        );
      
      case 'company':
        return (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {data.companyName || data.experiences?.[0]?.subtitle?.split(' · ')[0] || 'Not specified'}
              </div>
              {data.companyIndustry && (
                <div className="text-xs text-gray-500 truncate">
                  {data.companyIndustry}
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
              {data.jobTitle || data.experiences?.[0]?.title || 'Not specified'}
            </span>
          </div>
        );
      
      case 'duration':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{data.currentJobDuration || data.experiences?.[0]?.caption?.split(' · ')[1] || 'Not specified'}</span>
          </div>
        );
      
      case 'experience':
        return (
          <div className="text-sm text-gray-600">
            {data.experiences?.length || 0} positions
          </div>
        );
      
      case 'education':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>{data.educations?.length || 0} schools</span>
          </div>
        );
      
      case 'skills':
        return (
          <div className="max-w-xs">
            {data.skills && data.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.skills.slice(0, 3).map((skill: any, idx: number) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {skill.title}
                  </span>
                ))}
                {data.skills.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{data.skills.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No skills listed</span>
            )}
          </div>
        );
      
      case 'certifications':
        return (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>{data.licenseAndCertificates?.length || 0} certs</span>
          </div>
        );
      
      case 'email':
        return data.email ? (
          <a 
            href={`mailto:${data.email}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Mail className="w-4 h-4" />
            {data.email}
          </a>
        ) : (
          <span className="text-sm text-gray-500">Not available</span>
        );
      
      case 'phone':
        return data.mobileNumber ? (
          <a 
            href={`tel:${data.mobileNumber}`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Phone className="w-4 h-4" />
            {data.mobileNumber}
          </a>
        ) : (
          <span className="text-sm text-gray-500">Not available</span>
        );
      
      case 'website':
        return data.creatorWebsite?.link ? (
          <a 
            href={data.creatorWebsite.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <Globe className="w-4 h-4" />
            {data.creatorWebsite.name || 'Website'}
          </a>
        ) : (
          <span className="text-sm text-gray-500">Not available</span>
        );

      case 'tags':
        return (
          <div className="max-w-xs">
            {profile.tags && profile.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {profile.tags.slice(0, 3).map((tag, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                {profile.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{profile.tags.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No tags</span>
            )}
          </div>
        );
      
      case 'updated':
        const dateInfo = formatDate(profile.last_updated);
        return (
          <div className="group relative">
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${dateInfo.color} ${isProfileUpdating ? 'animate-pulse' : ''}`}>
              {isProfileUpdating ? 'Updating...' : dateInfo.text}
            </span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
              <div className="font-medium">Last Updated</div>
              <div>{dateInfo.exact}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        );
      
      case 'actions':
        return (
          <div className="flex gap-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(data)}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Details
              </button>
            )}
            
            <button
              onClick={() => handleSingleProfileUpdate(profile.linkedin_url || data.linkedinUrl, profile.id)}
              disabled={isUpdating}
              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
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
            Saved Profiles ({filteredProfiles.length})
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
                      { key: 'hasWebsite', label: 'Website', icon: Globe },
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
            
            <div className="flex gap-2">
              <select
                onChange={(e) => onExport(e.target.value, false)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue=""
              >
                <option value="" disabled>Export All...</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedProfiles.size} profiles selected
                </span>
              </div>
              
              <div className="flex gap-2">
                {onUpdateSelectedProfiles && (
                  <button
                    onClick={handleBulkUpdate}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Update Selected
                  </button>
                )}
                
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkExport(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue=""
                >
                  <option value="" disabled>Export Selected...</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
                
                {onDeleteSelectedProfiles && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedProfiles(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Column Visibility Controls */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
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
          
          <div className="flex flex-wrap gap-2">
            {allColumns.map(column => (
              <button
                key={column.key}
                onClick={() => toggleColumn(column.key)}
                disabled={column.key === 'select' || column.key === 'actions'}
                className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full transition-colors ${
                  visibleColumns.has(column.key)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${(column.key === 'select' || column.key === 'actions') ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            {filteredProfiles.map((profile) => (
              <tr 
                key={profile.id} 
                className={`hover:bg-gray-50 ${selectedProfiles.has(profile.id) ? 'bg-blue-50' : ''} ${updatingProfiles.has(profile.id) ? 'bg-yellow-50' : ''}`}
              >
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
    </div>
  );
};