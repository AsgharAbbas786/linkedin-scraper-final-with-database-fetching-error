import { supabase } from './supabase';
import type { LinkedInProfile, ScrapingJob } from './supabase';

export class DatabaseService {
  // Profile operations
  async getProfile(linkedinUrl: string): Promise<LinkedInProfile | null> {
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .select('*')
      .eq('linkedin_url', linkedinUrl)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  async upsertProfile(linkedinUrl: string, profileData: any): Promise<LinkedInProfile> {
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .upsert({
        linkedin_url: linkedinUrl,
        profile_data: profileData,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'linkedin_url'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getProfiles(limit?: number): Promise<LinkedInProfile[]> {
    let query = supabase
      .from('linkedin_profiles')
      .select('*')
      .order('last_updated', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateProfile(id: string, profileData: any): Promise<LinkedInProfile> {
    const { data, error } = await supabase
      .from('linkedin_profiles')
      .update({
        profile_data: profileData,
        last_updated: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Job operations
  async createJob(jobType: ScrapingJob['job_type'], inputUrl: string): Promise<ScrapingJob> {
    const { data, error } = await supabase
      .from('scraping_jobs')
      .insert({
        job_type: jobType,
        input_url: inputUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateJobStatus(
    id: string, 
    status: ScrapingJob['status'], 
    resultsCount?: number,
    errorMessage?: string
  ): Promise<ScrapingJob> {
    const updateData: any = {
      status,
      ...(resultsCount !== undefined && { results_count: resultsCount }),
      ...(errorMessage && { error_message: errorMessage }),
      ...(status === 'completed' && { completed_at: new Date().toISOString() })
    };

    const { data, error } = await supabase
      .from('scraping_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getJobs(limit?: number): Promise<ScrapingJob[]> {
    let query = supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export const dbService = new DatabaseService();