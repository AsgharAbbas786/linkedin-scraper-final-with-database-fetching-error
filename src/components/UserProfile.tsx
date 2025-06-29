import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, Mail, Lock, Eye, EyeOff, Camera, Save, X, 
  ArrowLeft, Loader2, AlertCircle, CheckCircle, Upload,
  Edit3, Shield, Settings
} from 'lucide-react';

interface UserProfileProps {
  user: any;
  onBack: () => void;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
  bio: string;
  company: string;
  jobTitle: string;
  location: string;
  website: string;
  phone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    profileImage: '',
    bio: '',
    company: '',
    jobTitle: '',
    location: '',
    website: '',
    phone: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // Get user metadata from auth
      const authData = {
        firstName: user?.user_metadata?.first_name || '',
        lastName: user?.user_metadata?.last_name || '',
        email: user?.email || '',
        profileImage: user?.user_metadata?.avatar_url || '',
        bio: user?.user_metadata?.bio || '',
        company: user?.user_metadata?.company || '',
        jobTitle: user?.user_metadata?.job_title || '',
        location: user?.user_metadata?.location || '',
        website: user?.user_metadata?.website || '',
        phone: user?.user_metadata?.phone || ''
      };

      setProfileData(authData);
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Convert to base64 for storage in user metadata
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileData(prev => ({
          ...prev,
          profileImage: base64String
        }));
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to process image' });
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        email: profileData.email,
        data: {
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          full_name: `${profileData.firstName} ${profileData.lastName}`,
          avatar_url: profileData.profileImage,
          bio: profileData.bio,
          company: profileData.company,
          job_title: profileData.jobTitle,
          location: profileData.location,
          website: profileData.website,
          phone: profileData.phone
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const handleChangePassword = async () => {
    setSaving(true);
    setMessage(null);

    // Validate passwords
    if (!passwordData.currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      setSaving(false);
      return;
    }

    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'New password does not meet security requirements' });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () => {
    const firstName = profileData.firstName || user?.user_metadata?.first_name || '';
    const lastName = profileData.lastName || user?.user_metadata?.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    const email = profileData.email || user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  const passwordValidation = validatePassword(passwordData.newPassword);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Profile Settings</h1>
            </div>
            
            {activeTab === 'profile' && (
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        loadUserProfile(); // Reset changes
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                Security
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Profile Picture Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {profileData.profileImage ? (
                        <img 
                          src={profileData.profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-gray-600">
                          {getUserInitials()}
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profileData.firstName} {profileData.lastName}
                    </h3>
                    <p className="text-gray-600">{profileData.email}</p>
                    {profileData.jobTitle && (
                      <p className="text-sm text-gray-500">{profileData.jobTitle}</p>
                    )}
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={profileData.jobTitle}
                      onChange={(e) => handleProfileInputChange('jobTitle', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => handleProfileInputChange('company', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleProfileInputChange('location', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g. +1 (555) 123-4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) => handleProfileInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g. https://yourwebsite.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Password Requirements */}
                      {passwordData.newPassword && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-gray-600">Password must contain:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.minLength ? 'bg-green-600' : 'bg-gray-300'}`} />
                              8+ characters
                            </div>
                            <div className={`flex items-center gap-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-600' : 'bg-gray-300'}`} />
                              Uppercase letter
                            </div>
                            <div className={`flex items-center gap-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-600' : 'bg-gray-300'}`} />
                              Lowercase letter
                            </div>
                            <div className={`flex items-center gap-1 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasNumbers ? 'bg-green-600' : 'bg-gray-300'}`} />
                              Number
                            </div>
                            <div className={`flex items-center gap-1 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'} col-span-2`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasSpecialChar ? 'bg-green-600' : 'bg-gray-300'}`} />
                              Special character (!@#$%^&*)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <div className="mt-2 text-xs text-red-600">Passwords do not match</div>
                      )}
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={
                        isSaving || 
                        !passwordData.currentPassword || 
                        !passwordValidation.isValid || 
                        passwordData.newPassword !== passwordData.confirmPassword
                      }
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      {isSaving ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Account Information */}
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">Account Created</div>
                        <div className="text-sm text-gray-600">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">Last Sign In</div>
                        <div className="text-sm text-gray-600">
                          {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">Email Verified</div>
                        <div className="text-sm text-gray-600">
                          {user?.email_confirmed_at ? (
                            <span className="text-green-600">✓ Verified</span>
                          ) : (
                            <span className="text-amber-600">⚠ Not verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};