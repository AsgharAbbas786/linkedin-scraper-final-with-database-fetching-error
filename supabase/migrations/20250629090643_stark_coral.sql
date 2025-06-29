/*
  # Clerk Integration Setup Migration

  This migration sets up the complete database schema for the LinkedIn Scraper application
  with Clerk authentication integration.

  ## What this migration does:

  1. **Database Schema Setup**
     - Creates all necessary tables: users, apify_keys, linkedin_profiles, scraping_jobs
     - Sets up proper relationships and constraints
     - Creates performance indexes

  2. **Clerk Authentication Integration**
     - Modifies users table to work with Clerk user IDs (text type)
     - Creates function to get/create user profiles from Clerk JWT data
     - Sets up proper RLS policies for Clerk authentication

  3. **Row Level Security (RLS)**
     - Enables RLS on all tables
     - Creates policies that work with Clerk's auth.uid() function
     - Ensures users can only access their own data

  4. **Performance Optimization**
     - Creates indexes for fast queries
     - Optimizes for LinkedIn profile searches and user data access

  ## Important Notes:
  - This migration assumes Clerk JWT integration is configured in Supabase
  - The auth.uid() function will return the Clerk user ID
  - Users table stores Clerk user IDs as text (not UUID)
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search capabilities

-- Clean up any existing objects (for fresh start)
-- Drop policies first
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.apify_keys;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can update profiles they own" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can delete profiles they own" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can manage own scraping jobs" ON public.scraping_jobs;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(uuid);
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(text);

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.scraping_jobs CASCADE;
DROP TABLE IF EXISTS public.apify_keys CASCADE;
DROP TABLE IF EXISTS public.linkedin_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (modified for Clerk integration)
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Store Clerk user ID as text (Clerk uses string IDs, not UUIDs)
  auth_user_id text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create apify_keys table
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

-- Create linkedin_profiles table
CREATE TABLE public.linkedin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  linkedin_url text UNIQUE NOT NULL,
  profile_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'::text[]
);

-- Create scraping_jobs table
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

-- Create performance indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);

CREATE INDEX idx_apify_keys_user_id ON public.apify_keys(user_id);
CREATE INDEX idx_apify_keys_active ON public.apify_keys(is_active);

CREATE INDEX idx_linkedin_profiles_user_id ON public.linkedin_profiles(user_id);
CREATE INDEX idx_linkedin_profiles_url ON public.linkedin_profiles(linkedin_url);
CREATE INDEX idx_linkedin_profiles_updated ON public.linkedin_profiles(last_updated);
CREATE INDEX idx_linkedin_profiles_tags ON public.linkedin_profiles USING GIN (tags);

CREATE INDEX idx_scraping_jobs_user_id ON public.scraping_jobs(user_id);
CREATE INDEX idx_scraping_jobs_status ON public.scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_type ON public.scraping_jobs(job_type);
CREATE INDEX idx_scraping_jobs_created_at ON public.scraping_jobs(created_at);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
-- Note: auth.uid() will return the Clerk user ID when properly configured
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Create RLS policies for apify_keys table
CREATE POLICY "Users can manage own API keys"
  ON public.apify_keys
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Create RLS policies for linkedin_profiles table
-- All authenticated users can read all profiles (shared data)
CREATE POLICY "Users can read all profiles"
  ON public.linkedin_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert profiles"
  ON public.linkedin_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update profiles they own"
  ON public.linkedin_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete profiles they own"
  ON public.linkedin_profiles
  FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Create RLS policies for scraping_jobs table
CREATE POLICY "Users can manage own scraping jobs"
  ON public.scraping_jobs
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Function to get or create user profile for Clerk users
-- This function extracts user data from Clerk JWT and creates/returns user profile
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_auth_id text)
RETURNS public.users AS $$
DECLARE
  user_profile public.users;
  _email text;
  _full_name text;
  _username text;
  _first_name text;
  _last_name text;
BEGIN
  -- Set secure search path to prevent search_path manipulation attacks
  SET search_path = public, pg_temp;
  
  -- Try to find existing user profile
  SELECT * INTO user_profile FROM public.users WHERE auth_user_id = user_auth_id;
  
  IF user_profile IS NULL THEN
    -- Extract user data from JWT claims provided by Clerk
    -- Clerk JWTs typically include these fields in the claims
    _email := auth.jwt() ->> 'email';
    _first_name := auth.jwt() ->> 'given_name';
    _last_name := auth.jwt() ->> 'family_name';
    _full_name := auth.jwt() ->> 'name';

    -- Fallback strategies for missing data
    IF _full_name IS NULL OR _full_name = '' THEN
      IF _first_name IS NOT NULL AND _last_name IS NOT NULL THEN
        _full_name := _first_name || ' ' || _last_name;
      ELSIF _first_name IS NOT NULL THEN
        _full_name := _first_name;
      ELSE
        _full_name := split_part(_email, '@', 1); -- Use email username as fallback
      END IF;
    END IF;

    -- Generate a unique username
    _username := lower(replace(COALESCE(_full_name, split_part(_email, '@', 1)), ' ', '_'));
    
    -- Ensure username uniqueness by appending numbers if needed
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = _username) LOOP
      _username := _username || '_' || floor(random() * 1000)::text;
    END LOOP;

    -- Insert new user profile
    INSERT INTO public.users (auth_user_id, username, email, full_name)
    VALUES (
      user_auth_id,
      _username,
      COALESCE(_email, user_auth_id || '@clerk.local'), -- Fallback email if not provided
      _full_name
    )
    RETURNING * INTO user_profile;
    
    -- Log the creation for debugging
    RAISE NOTICE 'Created new user profile for Clerk ID: %, Email: %', user_auth_id, _email;
  END IF;
  
  RETURN user_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant execute permission on the user profile function
GRANT EXECUTE ON FUNCTION public.get_or_create_user_profile(text) TO authenticated;

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply the trigger to apify_keys table
CREATE TRIGGER update_apify_keys_updated_at
  BEFORE UPDATE ON public.apify_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some helpful comments for documentation
COMMENT ON TABLE public.users IS 'User profiles linked to Clerk authentication';
COMMENT ON COLUMN public.users.auth_user_id IS 'Clerk user ID (string format)';
COMMENT ON TABLE public.apify_keys IS 'API keys for Apify scraping service';
COMMENT ON TABLE public.linkedin_profiles IS 'Scraped LinkedIn profile data';
COMMENT ON TABLE public.scraping_jobs IS 'History of scraping operations';
COMMENT ON FUNCTION public.get_or_create_user_profile(text) IS 'Creates or retrieves user profile from Clerk JWT data';