import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'linkedin-scraper'
    }
  }
})

// Database types
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

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    console.log('🔍 Getting current user...');
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('❌ Error getting current user:', error)
      return null
    }
    console.log('✅ Current user retrieved:', user?.id);
    return user
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}

export const getUserProfile = async (authUserId: string): Promise<User | null> => {
  try {
    console.log('🔍 Getting user profile for auth user ID:', authUserId);
    const { data, error } = await supabase
      .rpc('get_or_create_user_profile', { user_auth_id: authUserId })
    
    if (error) {
      console.error('❌ Error getting user profile:', error)
      return null
    }
    
    console.log('✅ User profile retrieved:', data?.id);
    return data
  } catch (error) {
    console.error('❌ Error getting user profile:', error)
    return null
  }
}

// Profile optimization functions
export const checkProfileExists = async (linkedinUrl: string): Promise<LinkedInProfile | null> => {
  try {
    console.log('🔍 Checking if profile exists:', linkedinUrl);
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('linkedin_url', linkedinUrl)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', error)
      return null
    }
    
    console.log('✅ Profile check result:', data ? 'exists' : 'not found');
    return data
  } catch (error) {
    console.error('❌ Error checking profile:', error)
    return null
  }
}

export const upsertProfile = async (
  userId: string, 
  linkedinUrl: string, 
  profileData: any,
  tags: string[] = []
): Promise<LinkedInProfile | null> => {
  try {
    console.log('🔍 Starting profile upsert for user:', userId, 'URL:', linkedinUrl);
    console.log('📊 Profile data size:', JSON.stringify(profileData).length, 'characters');
    
    // TEMPORARILY BYPASS IMAGE OPTIMIZATION FOR DEBUGGING
    const BYPASS_IMAGE_OPTIMIZATION = true;
    
    let optimizedProfileData = profileData;
    
    if (!BYPASS_IMAGE_OPTIMIZATION) {
      console.log('🖼️ Starting image optimization...');
      try {
        // Import image storage service
        const { ImageStorageService } = await import('../utils/imageStorage');
        
        // Optimize images before storing
        optimizedProfileData = await ImageStorageService.optimizeProfileImages(
          profileData, 
          `${userId}-${Date.now()}`
        );
        console.log('✅ Image optimization completed');
      } catch (imageError) {
        console.error('❌ Image optimization failed:', imageError);
        // Continue with original data if image optimization fails
        optimizedProfileData = profileData;
      }
    } else {
      console.log('⚠️ Image optimization bypassed for debugging');
    }

    console.log('💾 Starting database upsert...');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .upsert({
        user_id: userId,
        linkedin_url: linkedinUrl,
        profile_data: optimizedProfileData,
        tags,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'linkedin_url'
      })
      .select()
      .single()
    
    const endTime = Date.now();
    console.log(`⏱️ Database upsert took ${endTime - startTime}ms`);
    
    if (error) {
      console.error('❌ Database upsert error:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return null
    }
    
    console.log('✅ Profile upserted successfully:', data.id);
    return data
  } catch (error) {
    console.error('❌ Critical error in upsertProfile:', error);
    if (error instanceof Error) {
      console.error('❌ Error stack:', error.stack);
    }
    return null
  }
}

export const getUserProfiles = async (userId: string): Promise<LinkedInProfile[]> => {
  try {
    console.log('🔍 Getting profiles for user:', userId);
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false })
    
    if (error) {
      console.error('❌ Error getting user profiles:', error)
      return []
    }
    
    console.log('✅ Retrieved', data?.length || 0, 'user profiles');
    return data || []
  } catch (error) {
    console.error('❌ Error getting user profiles:', error)
    return []
  }
}

export const getAllProfiles = async (): Promise<LinkedInProfile[]> => {
  try {
    console.log('🔍 Getting all profiles...');
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .order('last_updated', { ascending: false })
    
    if (error) {
      console.error('❌ Error getting all profiles:', error)
      return []
    }
    
    console.log('✅ Retrieved', data?.length || 0, 'total profiles');
    return data || []
  } catch (error) {
    console.error('❌ Error getting all profiles:', error)
    return []
  }
}