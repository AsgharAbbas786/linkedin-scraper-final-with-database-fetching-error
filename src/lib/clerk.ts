import { createClerkSupabaseClient } from './supabase-clerk';

// Clerk configuration
export const clerkConfig = {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignInUrl: '/',
  afterSignUpUrl: '/',
};

// Create Supabase client that works with Clerk
export const supabase = createClerkSupabaseClient();

if (!clerkConfig.publishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}