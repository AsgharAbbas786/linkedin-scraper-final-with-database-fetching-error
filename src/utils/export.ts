export const exportData = (data: any[], format: string, filename: string = 'linkedin_data', selectedProfiles?: Set<string>) => {
  // Filter data if selectedProfiles is provided
  let exportData = data;
  if (selectedProfiles && selectedProfiles.size > 0) {
    exportData = data.filter(item => selectedProfiles.has(item.id));
  }

  switch (format) {
    case 'csv':
      exportToCSV(exportData, filename);
      break;
    case 'json':
      exportToJSON(exportData, filename);
      break;
    case 'xlsx':
      // For Excel export, we'll use a simple CSV for now
      // In a real app, you'd use a library like xlsx
      exportToCSV(exportData, filename);
      break;
    default:
      console.error('Unsupported export format:', format);
  }
};

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  // Flatten the profile data for CSV export with all available fields
  const flattenedData = data.map(profile => {
    const element = profile.profile_data || {};
    return {
      // Basic Info
      id: profile.id,
      linkedin_url: profile.linkedin_url || element.linkedinUrl,
      public_identifier: element.publicIdentifier || '',
      first_name: element.firstName || '',
      last_name: element.lastName || '',
      full_name: element.fullName || `${element.firstName || ''} ${element.lastName || ''}`.trim(),
      headline: element.headline || '',
      about: element.about || '',
      
      // Location
      address_with_country: element.addressWithCountry || '',
      address_country_only: element.addressCountryOnly || '',
      address_without_country: element.addressWithoutCountry || '',
      
      // Metrics
      connections: element.connections || 0,
      followers: element.followers || 0,
      
      // Current Job
      job_title: element.jobTitle || '',
      company_name: element.companyName || '',
      company_industry: element.companyIndustry || '',
      company_website: element.companyWebsite || '',
      company_linkedin: element.companyLinkedin || '',
      company_founded_in: element.companyFoundedIn || '',
      company_size: element.companySize || '',
      current_job_duration: element.currentJobDuration || '',
      current_job_duration_years: element.currentJobDurationInYrs || 0,
      
      // Contact
      email: element.email || '',
      mobile_number: element.mobileNumber || '',
      
      // Profile Images
      profile_pic: element.profilePic || '',
      profile_pic_high_quality: element.profilePicHighQuality || '',
      
      // Website
      creator_website_name: element.creatorWebsite?.name || '',
      creator_website_link: element.creatorWebsite?.link || '',
      
      // Counts
      experience_count: element.experiences?.length || 0,
      education_count: element.educations?.length || 0,
      skills_count: element.skills?.length || 0,
      certifications_count: element.licenseAndCertificates?.length || 0,
      publications_count: element.publications?.length || 0,
      volunteer_count: element.volunteerAndAwards?.length || 0,
      
      // Top Skills (first 10)
      top_skills: element.skills?.slice(0, 10).map((s: any) => s.title).join('; ') || '',
      
      // Latest Experience
      latest_experience_title: element.experiences?.[0]?.title || '',
      latest_experience_company: element.experiences?.[0]?.subtitle?.split(' · ')[0] || '',
      latest_experience_duration: element.experiences?.[0]?.caption || '',
      latest_experience_location: element.experiences?.[0]?.metadata || '',
      
      // Latest Education
      latest_education_school: element.educations?.[0]?.title || '',
      latest_education_degree: element.educations?.[0]?.subtitle || '',
      latest_education_period: element.educations?.[0]?.caption || '',
      
      // Latest Certification
      latest_certification: element.licenseAndCertificates?.[0]?.title || '',
      latest_certification_issuer: element.licenseAndCertificates?.[0]?.subtitle || '',
      latest_certification_date: element.licenseAndCertificates?.[0]?.caption || '',
      
      // Metadata
      open_connection: element.openConnection || false,
      urn: element.urn || '',
      top_skills_by_endorsements: element.topSkillsByEndorsements || '',
      
      // Timestamps
      last_updated: profile.last_updated || '',
      created_at: profile.created_at || ''
    };
  });

  const headers = Object.keys(flattenedData[0]);
  const csvContent = [
    headers.join(','),
    ...flattenedData.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};