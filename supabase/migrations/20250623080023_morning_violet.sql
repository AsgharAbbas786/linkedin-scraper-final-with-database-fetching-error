-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.apify_keys;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can update profiles they own" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can delete profiles they own" ON public.linkedin_profiles;
DROP POLICY IF EXISTS "Users can manage own scraping jobs" ON public.scraping_jobs;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(uuid);

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create apify_keys table for multiple API keys per user
CREATE TABLE IF NOT EXISTS public.apify_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key_name)
);

-- Create linkedin_profiles table (shared between users but with ownership tracking)
CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE, -- Original scraper
  linkedin_url text UNIQUE NOT NULL,
  profile_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  tags text[] DEFAULT '{}'::text[]
);

-- Create scraping_jobs table
CREATE TABLE IF NOT EXISTS public.scraping_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  apify_key_id uuid REFERENCES public.apify_keys(id) ON DELETE SET NULL,
  job_type text NOT NULL CHECK (job_type = ANY (ARRAY['post_comments'::text, 'profile_details'::text, 'mixed'::text])),
  input_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  results_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE INDEX IF NOT EXISTS idx_apify_keys_user_id ON public.apify_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_apify_keys_active ON public.apify_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_user_id ON public.linkedin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_url ON public.linkedin_profiles(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_updated ON public.linkedin_profiles(last_updated);
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_tags ON public.linkedin_profiles USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON public.scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON public.scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_type ON public.scraping_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON public.scraping_jobs(created_at);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

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

-- Create RLS policies for linkedin_profiles table (shared but with ownership)
CREATE POLICY "Users can read all profiles"
  ON public.linkedin_profiles
  FOR SELECT
  TO authenticated
  USING (true); -- All users can read all profiles

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

-- Function to handle new user registration (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _username text;
  _full_name text;
  _first_name text;
  _last_name text;
BEGIN
  -- Set secure search path to prevent search_path manipulation attacks
  SET search_path = public, pg_temp;
  
  -- Extract values from raw_user_meta_data safely
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    _username := NEW.raw_user_meta_data->>'username';
    _full_name := NEW.raw_user_meta_data->>'full_name';
    _first_name := NEW.raw_user_meta_data->>'first_name';
    _last_name := NEW.raw_user_meta_data->>'last_name';
  END IF;

  -- Determine final username
  IF _username IS NULL OR _username = '' THEN
    _username := split_part(NEW.email, '@', 1) || '-' || substring(NEW.id::text from 1 for 8);
  END IF;

  -- Determine final full_name
  IF _full_name IS NULL OR _full_name = '' THEN
    IF _first_name IS NOT NULL AND _last_name IS NOT NULL THEN
      _full_name := _first_name || ' ' || _last_name;
    ELSE
      _full_name := NULL; -- Or some default if both are missing
    END IF;
  END IF;

  INSERT INTO public.users (auth_user_id, username, email, full_name)
  VALUES (
    NEW.id,
    _username,
    NEW.email,
    _full_name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Trigger to automatically create user profile on signup
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Function to get or create user profile (FIXED: Added SET search_path)
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_auth_id uuid)
RETURNS public.users AS $$
DECLARE
  user_profile public.users;
BEGIN
  -- Set secure search path to prevent search_path manipulation attacks
  SET search_path = public, pg_temp;
  
  SELECT * INTO user_profile FROM public.users WHERE auth_user_id = user_auth_id;
  
  IF user_profile IS NULL THEN
    -- Get user data from auth.users
    INSERT INTO public.users (auth_user_id, username, email, full_name)
    SELECT 
      id,
      COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
      email,
      COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'first_name' || ' ' || raw_user_meta_data->>'last_name')
    FROM auth.users 
    WHERE id = user_auth_id
    RETURNING * INTO user_profile;
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