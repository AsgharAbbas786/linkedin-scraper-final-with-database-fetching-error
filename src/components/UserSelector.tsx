import React, { useState, useEffect } from 'react';
import { User, Plus, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User as UserType } from '../lib/supabase';

interface UserSelectorProps {
  currentUser: UserType | null;
  onUserChange: (user: UserType) => void;
  onManageUsers: () => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  currentUser,
  onUserChange,
  onManageUsers
}) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', full_name: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      // Auto-select first user if none selected
      if (!currentUser && data && data.length > 0) {
        onUserChange(data[0]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => [data, ...prev]);
      onUserChange(data);
      setNewUser({ username: '', email: '', full_name: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Current User</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
          <button
            onClick={onManageUsers}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Create New User</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Full Name (optional)"
              value={newUser.full_name}
              onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={createUser}
                disabled={isLoading || !newUser.username || !newUser.email}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {currentUser && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{currentUser.full_name || currentUser.username}</div>
            <div className="text-sm text-gray-600">{currentUser.email}</div>
          </div>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const user = users.find(u => u.id === e.target.value);
              if (user) onUserChange(user);
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {!currentUser && users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No users found. Create your first user to get started.</p>
        </div>
      )}
    </div>
  );
};