import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  user: any;
  onOpenProfile?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleOpenProfile = () => {
    setIsOpen(false);
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getProfileImage = () => {
    return user?.user_metadata?.avatar_url || null;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {getProfileImage() ? (
            <img 
              src={getProfileImage()} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            getUserInitials()
          )}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">{getUserDisplayName()}</div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white font-medium">
                {getProfileImage() ? (
                  <img 
                    src={getProfileImage()} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                {user?.user_metadata?.job_title && (
                  <div className="text-xs text-gray-400 truncate">{user.user_metadata.job_title}</div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleOpenProfile}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <User className="w-4 h-4" />
              View Profile
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};