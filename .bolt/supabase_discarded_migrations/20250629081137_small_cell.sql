-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean up existing objects to ensure fresh start
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_user_profile(uuid) CASCADE;

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Drop and recreate tables to ensure clean schema
DROP TABLE IF EXISTS public.scraping_jobs CASCADE;
DROP TABLE IF EXISTS public.linkedin_profiles CASCADE;
DROP TABLE IF EXISTS public.apify_keys CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with proper structure
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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
    status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])),
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

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apify_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create secure user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    _username text;
    _full_name text;
    _first_name text;
    _last_name text;
    _email text;
    temp_username text;
    username_exists boolean;
BEGIN
    -- Ensure we have required data
    IF NEW.email IS NULL THEN
        RAISE EXCEPTION 'Email is required for user creation';
    END IF;
    
    _email := NEW.email;
    
    -- Extract metadata safely
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        _username := NEW.raw_user_meta_data->>'username';
        _full_name := NEW.raw_user_meta_data->>'full_name';
        _first_name := NEW.raw_user_meta_data->>'first_name';
        _last_name := NEW.raw_user_meta_data->>'last_name';
    END IF;

    -- Generate username if not provided
    IF _username IS NULL OR _username = '' THEN
        _username := split_part(_email, '@', 1);
    END IF;

    -- Ensure username is unique, append suffix if necessary
    temp_username := _username;
    LOOP
        SELECT EXISTS (SELECT 1 FROM public.users WHERE username = temp_username) INTO username_exists;
        IF NOT username_exists THEN
            _username := temp_username;
            EXIT;
        END IF;
        temp_username := _username || '_' || substring(gen_random_uuid()::text from 1 for 4); -- Append short random string
    END LOOP;

    -- Generate full_name if not provided
    IF _full_name IS NULL OR _full_name = '' THEN
        IF _first_name IS NOT NULL AND _last_name IS NOT NULL THEN
            _full_name := _first_name || ' ' || _last_name;
        ELSE
            _full_name := split_part(_email, '@', 1); -- Fallback to email part if no names
        END IF;
    END IF;

    -- Insert user profile with conflict resolution on auth_user_id
    -- If auth_user_id already exists, update email and full_name
    INSERT INTO public.users (auth_user_id, username, email, full_name)
    VALUES (NEW.id, _username, _email, _full_name)
    ON CONFLICT (auth_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = now();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth process
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create helper function for getting user profiles
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_auth_id uuid)
RETURNS public.users 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_profile public.users;
    auth_user auth.users;
    _username text;
    _full_name text;
    _email text;
    temp_username text;
    username_exists boolean;
BEGIN
    -- Try to get existing user profile
    SELECT * INTO user_profile 
    FROM public.users 
    WHERE auth_user_id = user_auth_id;
    
    -- If not found, create it
    IF user_profile IS NULL THEN
        -- Get auth user data
        SELECT * INTO auth_user 
        FROM auth.users 
        WHERE id = user_auth_id;
        
        IF auth_user IS NULL THEN
            RAISE EXCEPTION 'Auth user not found: %', user_auth_id;
        END IF;
        
        _email := auth_user.email;

        -- Generate username if not provided
        _username := COALESCE(auth_user.raw_user_meta_data->>'username', split_part(_email, '@', 1));

        -- Ensure username is unique, append suffix if necessary
        temp_username := _username;
        LOOP
            SELECT EXISTS (SELECT 1 FROM public.users WHERE username = temp_username) INTO username_exists;
            IF NOT username_exists THEN
                _username := temp_username;
                EXIT;
            END IF;
            temp_username := _username || '_' || substring(gen_random_uuid()::text from 1 for 4); -- Append short random string
        END LOOP;

        -- Generate full_name if not provided
        _full_name := COALESCE(
            auth_user.raw_user_meta_data->>'full_name',
            CASE 
                WHEN auth_user.raw_user_meta_data->>'first_name' IS NOT NULL 
                     AND auth_user.raw_user_meta_data->>'last_name' IS NOT NULL 
                THEN auth_user.raw_user_meta_data->>'first_name' || ' ' || auth_user.raw_user_meta_data->>'last_name'
                ELSE split_part(_email, '@', 1)
            END
        );

        -- Create user profile
        INSERT INTO public.users (auth_user_id, username, email, full_name)
        VALUES (auth_user.id, _username, _email, _full_name)
        ON CONFLICT (auth_user_id) DO UPDATE SET
            email = EXCLUDED.email, -- Update email if it changed in auth.users
            full_name = EXCLUDED.full_name, -- Update full_name if it changed
            updated_at = now()
        RETURNING * INTO user_profile;
    END IF;
    
    RETURN user_profile;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies for users table
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a test function to verify everything works
CREATE OR REPLACE FUNCTION public.test_user_creation()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    test_result text;
BEGIN
    -- Test that we can access the users table
    SELECT 'Database schema is working correctly' INTO test_result;
    
    -- Verify tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        test_result := 'ERROR: users table does not exist';
    END IF;
    
    RETURN test_result;
END;
$$;

-- Run the test
SELECT public.test_user_creation();

-- Add helpful comments
COMMENT ON TABLE public.users IS 'User profiles linked to Supabase Auth users';
COMMENT ON TABLE public.apify_keys IS 'API keys for Apify scraping service';
COMMENT ON TABLE public.linkedin_profiles IS 'Scraped LinkedIn profile data';
COMMENT ON TABLE public.scraping_jobs IS 'Tracking for scraping operations';

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create user profile when auth user is created';
COMMENT ON FUNCTION public.get_or_create_user_profile(uuid) IS 'Helper function to get or create user profile';
