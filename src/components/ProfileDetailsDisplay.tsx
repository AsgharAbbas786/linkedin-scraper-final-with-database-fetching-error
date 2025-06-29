import React from 'react';
import { User, MapPin, Users, Briefcase, GraduationCap, Award, ArrowLeft, ExternalLink, Mail, Phone, Globe, Calendar, Building } from 'lucide-react';

interface ProfileDetailsDisplayProps {
  profiles: any[];
  onBack: () => void;
}

export const ProfileDetailsDisplay: React.FC<ProfileDetailsDisplayProps> = ({
  profiles,
  onBack
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const renderProfileCard = (profile: any, index: number) => {
    return (
      <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {profile.profilePicHighQuality || profile.profilePic ? (
                <img 
                  src={profile.profilePicHighQuality || profile.profilePic} 
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white/60" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold mb-2">
                {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()}
              </h2>
              <p className="text-blue-100 text-lg mb-3">{profile.headline}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                {(profile.addressWithCountry || profile.addressCountryOnly || profile.addressWithoutCountry) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.addressWithCountry || profile.addressCountryOnly || profile.addressWithoutCountry}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{profile.connections?.toLocaleString() || '0'} connections</span>
                </div>
                
                {profile.followers && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{profile.followers.toLocaleString()} followers</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-4">
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View LinkedIn
                </a>
                
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                
                {profile.mobileNumber && (
                  <a
                    href={`tel:${profile.mobileNumber}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}

                {profile.creatorWebsite?.link && (
                  <a
                    href={profile.creatorWebsite.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {profile.creatorWebsite.name || 'Website'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="p-6 space-y-6">
          {/* About Section */}
          {profile.about && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                About
              </h3>
              <div className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                {profile.about}
              </div>
            </div>
          )}

          {/* Current Job */}
          {(profile.jobTitle || profile.companyName) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Current Position
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-900">{profile.jobTitle}</div>
                {profile.companyName && (
                  <div className="text-gray-600 flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4" />
                    {profile.companyName}
                  </div>
                )}
                {profile.currentJobDuration && (
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {profile.currentJobDuration}
                  </div>
                )}
                {profile.companyIndustry && (
                  <div className="text-sm text-gray-500 mt-1">{profile.companyIndustry}</div>
                )}
                {profile.companySize && (
                  <div className="text-sm text-gray-500 mt-1">{profile.companySize} employees</div>
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {profile.experiences && profile.experiences.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Experience ({profile.experiences.length})
              </h3>
              <div className="space-y-4">
                {profile.experiences.slice(0, 5).map((exp: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {exp.logo && (
                        <img src={exp.logo} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{exp.title}</div>
                        <div className="text-gray-600">{exp.subtitle}</div>
                        <div className="text-sm text-gray-500">{exp.caption}</div>
                        {exp.metadata && (
                          <div className="text-sm text-gray-500">{exp.metadata}</div>
                        )}
                        {exp.subComponents && exp.subComponents[0]?.description && (
                          <div className="mt-2 text-sm text-gray-700">
                            {exp.subComponents[0].description[0]?.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {profile.experiences.length > 5 && (
                  <div className="text-center text-sm text-gray-500">
                    ... and {profile.experiences.length - 5} more positions
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education */}
          {profile.educations && profile.educations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Education ({profile.educations.length})
              </h3>
              <div className="space-y-4">
                {profile.educations.map((edu: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {edu.logo && (
                        <img src={edu.logo} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{edu.title}</div>
                        <div className="text-gray-600">{edu.subtitle}</div>
                        {edu.caption && (
                          <div className="text-sm text-gray-500">{edu.caption}</div>
                        )}
                        {edu.subComponents && edu.subComponents[0]?.description && (
                          <div className="mt-2 text-sm text-gray-700">
                            {edu.subComponents[0].description.map((desc: any, i: number) => (
                              <div key={i}>{desc.text}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Skills ({profile.skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: any, idx: number) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.licenseAndCertificates && profile.licenseAndCertificates.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Certifications ({profile.licenseAndCertificates.length})
              </h3>
              <div className="space-y-3">
                {profile.licenseAndCertificates.map((cert: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-3">
                      {cert.logo && (
                        <img src={cert.logo} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{cert.title}</div>
                        <div className="text-gray-600">{cert.subtitle}</div>
                        {cert.caption && (
                          <div className="text-sm text-gray-500">{cert.caption}</div>
                        )}
                        {cert.metadata && (
                          <div className="text-sm text-gray-500">{cert.metadata}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {profile.publications && profile.publications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Publications ({profile.publications.length})
              </h3>
              <div className="space-y-3">
                {profile.publications.map((pub: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-medium text-gray-900">{pub.title}</div>
                    <div className="text-gray-600">{pub.subtitle}</div>
                    {pub.subComponents && pub.subComponents[0]?.description && (
                      <div className="mt-2 text-sm text-gray-700">
                        {pub.subComponents[0].description[0]?.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Experience */}
          {profile.volunteerAndAwards && profile.volunteerAndAwards.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Volunteer Experience ({profile.volunteerAndAwards.length})
              </h3>
              <div className="space-y-3">
                {profile.volunteerAndAwards.map((vol: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start gap-3">
                      {vol.logo && (
                        <img src={vol.logo} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{vol.title}</div>
                        <div className="text-gray-600">{vol.subtitle}</div>
                        <div className="text-sm text-gray-500">{vol.caption}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
              )}
              {profile.mobileNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">{profile.mobileNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <a 
                  href={profile.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
              {profile.creatorWebsite?.link && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <a 
                    href={profile.creatorWebsite.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.creatorWebsite.name || 'Personal Website'}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Profile Details ({profiles.length})
              </h2>
              <p className="text-gray-600">
                Detailed information for scraped LinkedIn profiles
              </p>
            </div>
          </div>
          
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="space-y-8">
        {profiles.map((profile, index) => renderProfileCard(profile, index))}
      </div>

      {profiles.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles found</h3>
          <p className="text-gray-600">No profile details to display</p>
        </div>
      )}
    </div>
  );
};