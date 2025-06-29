/*
  # Fix Authentication Schema Issues

  This migration fixes the database schema issues that cause "Database error updating user" 
  during signup. It addresses:

  1. User Creation Trigger
     - Fixes the handle_new_user() function to properly handle user data extraction
     - Adds better error handling and logging
     - Ensures proper constraint handling for username uniqueness

  2. Security
     - Maintains RLS policies
     - Ensures proper permissions
     - Uses secure search paths

  3. Data Integrity
     - Handles edge cases in user data extraction
     - Prevents constraint violations
     - Ensures proper fallback values
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  _username text;
  _full_name text;
  _first_name text;
  _last_name text;
  _email_prefix text;
  _unique_suffix text;
  _attempt_count integer := 0;
  _max_attempts integer := 10;
BEGIN
  -- Set secure search path
  SET search_path = public, pg_temp;
  
  -- Extract email prefix for username generation
  _email_prefix := split_part(NEW.email, '@', 1);
  
  -- Extract values from raw_user_meta_data safely
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    _username := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
    _full_name := NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), '');
    _first_name := NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), '');
    _last_name := NULLIF(trim(NEW.raw_user_meta_data->>'last_name'), '');
  END IF;

  -- Generate username if not provided
  IF _username IS NULL THEN
    _username := _email_prefix;
  END IF;

  -- Ensure username uniqueness with retry logic
  WHILE _attempt_count < _max_attempts LOOP
    BEGIN
      -- Try to insert with current username
      IF _attempt_count = 0 THEN
        -- First attempt with original username
        _unique_suffix := '';
      ELSE
        -- Subsequent attempts with suffix
        _unique_suffix := '-' || substring(NEW.id::text from 1 for 8) || '-' || _attempt_count::text;
      END IF;

      -- Construct final full_name
      IF _full_name IS NULL THEN
        IF _first_name IS NOT NULL AND _last_name IS NOT NULL THEN
          _full_name := _first_name || ' ' || _last_name;
        ELSIF _first_name IS NOT NULL THEN
          _full_name := _first_name;
        ELSIF _last_name IS NOT NULL THEN
          _full_name := _last_name;
        ELSE
          _full_name := _email_prefix; -- Fallback to email prefix
        END IF;
      END IF;

      -- Attempt to insert user
      INSERT INTO public.users (auth_user_id, username, email, full_name, created_at, updated_at)
      VALUES (
        NEW.id,
        _username || _unique_suffix,
        NEW.email,
        _full_name,
        now(),
        now()
      );
      
      -- If we get here, insert was successful
      EXIT;
      
    EXCEPTION 
      WHEN unique_violation THEN
        -- Username already exists, try with a different suffix
        _attempt_count := _attempt_count + 1;
        IF _attempt_count >= _max_attempts THEN
          -- Final fallback: use UUID
          _username := _email_prefix || '-' || replace(NEW.id::text, '-', '');
          INSERT INTO public.users (auth_user_id, username, email, full_name, created_at, updated_at)
          VALUES (
            NEW.id,
            _username,
            NEW.email,
            _full_name,
            now(),
            now()
          );
          EXIT;
        END IF;
      WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Ensure RLS is enabled and policies exist
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

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

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Update the get_or_create_user_profile function with better error handling
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_auth_id uuid)
RETURNS public.users AS $$
DECLARE
  user_profile public.users;
  auth_user_data record;
BEGIN
  SET search_path = public, pg_temp;
  
  -- First try to get existing profile
  SELECT * INTO user_profile FROM public.users WHERE auth_user_id = user_auth_id;
  
  IF user_profile IS NULL THEN
    -- Get user data from auth.users
    SELECT * INTO auth_user_data FROM auth.users WHERE id = user_auth_id;
    
    IF auth_user_data IS NULL THEN
      RAISE EXCEPTION 'Auth user not found: %', user_auth_id;
    END IF;
    
    -- Create profile with fallback values
    INSERT INTO public.users (auth_user_id, username, email, full_name, created_at, updated_at)
    VALUES (
      user_auth_id,
      COALESCE(
        NULLIF(trim(auth_user_data.raw_user_meta_data->>'username'), ''),
        split_part(auth_user_data.email, '@', 1) || '-' || substring(user_auth_id::text from 1 for 8)
      ),
      auth_user_data.email,
      COALESCE(
        NULLIF(trim(auth_user_data.raw_user_meta_data->>'full_name'), ''),
        CASE 
          WHEN auth_user_data.raw_user_meta_data->>'first_name' IS NOT NULL 
               AND auth_user_data.raw_user_meta_data->>'last_name' IS NOT NULL 
          THEN trim(auth_user_data.raw_user_meta_data->>'first_name') || ' ' || trim(auth_user_data.raw_user_meta_data->>'last_name')
          WHEN auth_user_data.raw_user_meta_data->>'first_name' IS NOT NULL 
          THEN trim(auth_user_data.raw_user_meta_data->>'first_name')
          ELSE split_part(auth_user_data.email, '@', 1)
        END
      ),
      now(),
      now()
    )
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