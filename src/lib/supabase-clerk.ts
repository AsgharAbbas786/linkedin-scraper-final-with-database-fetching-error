import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a Supabase client that integrates with Clerk
export function createClerkSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      // Custom fetch function that adds Clerk JWT to requests
      fetch: async (url, options = {}) => {
        const clerkToken = await window.Clerk?.session?.getToken({
          template: 'supabase'
        });

        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

// Hook to get Supabase client with Clerk authentication
export function useSupabaseClient() {
  const { getToken } = useAuth();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({ template: 'supabase' });

        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set('Authorization', `Bearer ${clerkToken}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

// Database types (keeping the same as before)
export interface User {
  id: string;
  auth_user_id: string;
  username: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ApifyKey {
  id: string;
  user_id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkedInProfile {
  id: string;
  user_id: string;
  linkedin_url: string;
  profile_data: any;
  last_updated: string;
  created_at: string;
  tags: string[];
}

export interface ScrapingJob {
  id: string;
  user_id: string;
  apify_key_id?: string;
  job_type: 'post_comments' | 'profile_details' | 'mixed';
  input_url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results_count: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// Helper functions for working with Clerk + Supabase
export const getCurrentUser = async () => {
  try {
    const user = window.Clerk?.user;
    return user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getUserProfile = async (clerkUserId: string): Promise<User | null> => {
  try {
    console.log('🔍 Getting user profile for Clerk user ID:', clerkUserId);
    const supabase = createClerkSupabaseClient();
    
    const { data, error } = await supabase
      .rpc('get_or_create_user_profile', { user_auth_id: clerkUserId });
    
    if (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
    
    console.log('✅ User profile retrieved:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

// Profile optimization functions (keeping the same as before)
export const checkProfileExists = async (linkedinUrl: string): Promise<LinkedInProfile | null> => {
  try {
    console.log('🔍 Checking if profile exists:', linkedinUrl);
    const supabase = createClerkSupabaseClient();
    
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('linkedin_url', linkedinUrl)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', error);
      return null;
    }
    
    console.log('✅ Profile check result:', data ? 'exists' : 'not found');
    return data;
  } catch (error) {
    console.error('❌ Error checking profile:', error);
    return null;
  }
};

export const upsertProfile = async (
  userId: string, 
  linkedinUrl: string, 
  profileData: any,
  tags: string[] = []
): Promise<LinkedInProfile | null> => {
  try {
    console.log('🔍 Starting profile upsert for user:', userId, 'URL:', linkedinUrl);
    const supabase = createClerkSupabaseClient();
    
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .upsert({
        user_id: userId,
        linkedin_url: linkedinUrl,
        profile_data: profileData,
        tags,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'linkedin_url'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database upsert error:', error);
      return null;
    }
    
    console.log('✅ Profile upserted successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Critical error in upsertProfile:', error);
    return null;
  }
};

export const getUserProfiles = async (userId: string): Promise<LinkedInProfile[]> => {
  try {
    console.log('🔍 Getting profiles for user:', userId);
    const supabase = createClerkSupabaseClient();
    
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });
    
    if (error) {
      console.error('❌ Error getting user profiles:', error);
      return [];
    }
    
    console.log('✅ Retrieved', data?.length || 0, 'user profiles');
    return data || [];
  } catch (error) {
    console.error('❌ Error getting user profiles:', error);
    return [];
  }
};

export const getAllProfiles = async (): Promise<LinkedInProfile[]> => {
  try {
    console.log('🔍 Getting all profiles...');
    const supabase = createClerkSupabaseClient();
    
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .order('last_updated', { ascending: false });
    
    if (error) {
      console.error('❌ Error getting all profiles:', error);
      return [];
    }
    
    console.log('✅ Retrieved', data?.length || 0, 'total profiles');
    return data || [];
  } catch (error) {
    console.error('❌ Error getting all profiles:', error);
    return [];
  }
};