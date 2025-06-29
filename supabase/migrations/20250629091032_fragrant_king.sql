/*
  # Complete Clerk + Supabase Integration Migration

  1. Database Schema
    - `users` table for user profiles (linked to Clerk users)
    - `apify_keys` table for API key management
    - `linkedin_profiles` table for scraped profile data
    - `scraping_jobs` table for job tracking

  2. Security
    - Row Level Security (RLS) enabled on all tables
    - JWT-based authentication using Clerk tokens
    - Secure policies for data access

  3. Functions
    - User profile creation and management
    - Automatic user setup on first access

  4. Performance
    - Optimized indexes for fast queries
    - GIN indexes for JSONB and array columns
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search capabilities

-- Clean up any existing objects (CASCADE will handle dependencies)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
DROP TRIGGER IF EXISTS update_apify_keys_updated_at ON public.apify_keys CASCADE;

-- Drop functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop policies (these don't have dependencies)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.apify_keys;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can update profiles they own" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can delete profiles they own" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can manage own scraping jobs" ON public.scraping_jobs;

-- Drop tables if they exist (CASCADE will handle foreign key dependencies)
DROP TABLE IF EXISTS public.scraping_jobs CASCADE;
DROP TABLE IF EXISTS public.linkedin_profiles CASCADE;
DROP TABLE IF EXISTS public.apify_keys CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create tables
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE NOT NULL, -- Clerk user ID (text, not uuid)
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.apify_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key_name)
);

CREATE TABLE public.linkedin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  linkedin_url text UNIQUE NOT NULL,
  profile_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'::text[]
);

CREATE TABLE public.scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  apify_key_id uuid REFERENCES public.apify_keys(id) ON DELETE SET NULL,
  job_type text NOT NULL CHECK (job_type = ANY (ARRAY['post_comments'::text, 'profile_details'::text, 'mixed'::text])),
  input_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  results_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_apify_keys_user_id ON public.apify_keys(user_id);
CREATE INDEX idx_apify_keys_active ON public.apify_keys(is_active);

CREATE INDEX idx_linkedin_profiles_user_id ON public.linkedin_profiles(user_id);
CREATE INDEX idx_linkedin_profiles_url ON public.linkedin_profiles(linkedin_url);
CREATE INDEX idx_linkedin_profiles_updated ON public.linkedin_profiles(last_updated);
CREATE INDEX idx_linkedin_profiles_tags ON public.linkedin_profiles USING GIN (tags);
CREATE INDEX idx_linkedin_profiles_data ON public.linkedin_profiles USING GIN (profile_data);

CREATE INDEX idx_scraping_jobs_user_id ON public.scraping_jobs(user_id);
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_type ON public.scraping_jobs(job_type);
CREATE INDEX idx_scraping_jobs_created_at ON public.scraping_jobs(created_at);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apify_keys_updated_at
  BEFORE UPDATE ON public.apify_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create user profile for Clerk users
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_auth_id text)
RETURNS public.users AS $$
DECLARE
  user_profile public.users;
  _username text;
  _email text;
  _full_name text;
BEGIN
  -- Set secure search path
  SET search_path = public, pg_temp;
  
  -- Try to find existing user
  SELECT * INTO user_profile 
  FROM public.users 
  WHERE auth_user_id = user_auth_id;
  
  -- If user doesn't exist, create one
  IF user_profile IS NULL THEN
    -- Extract user info from Clerk JWT claims
    -- In a real implementation, you'd get this from the JWT or Clerk webhook
    -- For now, we'll create a basic profile
    _username := 'user_' || substring(user_auth_id from 1 for 8);
    _email := _username || '@example.com'; -- This should come from Clerk
    _full_name := 'User ' || substring(user_auth_id from 1 for 8);
    
    -- Insert new user
    INSERT INTO public.users (auth_user_id, username, email, full_name)
    VALUES (user_auth_id, _username, _email, _full_name)
    RETURNING * INTO user_profile;
  END IF;
  
  RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.jwt() ->> 'sub');

-- Create RLS policies for apify_keys table
CREATE POLICY "Users can manage own API keys"
  ON public.apify_keys
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.jwt() ->> 'sub'
  ));

-- Create RLS policies for linkedin_profiles table
CREATE POLICY "Users can read all profiles"
  ON public.linkedin_profiles
  FOR SELECT
  TO authenticated
  USING (true); -- All authenticated users can read all profiles

CREATE POLICY "Users can insert profiles"
  ON public.linkedin_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update profiles they own"
  ON public.linkedin_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can delete profiles they own"
  ON public.linkedin_profiles
  FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.jwt() ->> 'sub'
  ));

-- Create RLS policies for scraping_jobs table
CREATE POLICY "Users can manage own scraping jobs"
  ON public.scraping_jobs
  FOR ALL
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users 
    WHERE auth_user_id = auth.jwt() ->> 'sub'
  ));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create storage bucket for profile images (if it doesn't exist)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-images', 'profile-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create storage policies
CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images');