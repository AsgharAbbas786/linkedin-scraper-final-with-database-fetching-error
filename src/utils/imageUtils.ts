export const convertImageToBase64 = async (imageUrl: string): Promise<string | null> => {
  try {
    // Check if the URL is already a base64 string
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    const response = await fetch(imageUrl, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*',
      }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status}`);
      return null;
    }

    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.warn('Failed to convert image to base64');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Error converting image to base64:', error);
    return null;
  }
};

export const processProfileImages = async (profile: any): Promise<any> => {
  const processedProfile = { ...profile };

  // Convert main profile picture
  if (profile.profilePic && !profile.profilePic.startsWith('data:image/')) {
    const base64Image = await convertImageToBase64(profile.profilePic);
    if (base64Image) {
      processedProfile.profilePic = base64Image;
    }
  }

  // Convert high quality profile picture
  if (profile.profilePicHighQuality && !profile.profilePicHighQuality.startsWith('data:image/')) {
    const base64Image = await convertImageToBase64(profile.profilePicHighQuality);
    if (base64Image) {
      processedProfile.profilePicHighQuality = base64Image;
    }
  }

  // Convert experience company logos
  if (profile.experiences && Array.isArray(profile.experiences)) {
    processedProfile.experiences = await Promise.all(
      profile.experiences.map(async (exp: any) => {
        if (exp.logo && !exp.logo.startsWith('data:image/')) {
          const base64Logo = await convertImageToBase64(exp.logo);
          if (base64Logo) {
            return { ...exp, logo: base64Logo };
          }
        }
        return exp;
      })
    );
  }

  // Convert education logos
  if (profile.educations && Array.isArray(profile.educations)) {
    processedProfile.educations = await Promise.all(
      profile.educations.map(async (edu: any) => {
        if (edu.logo && !edu.logo.startsWith('data:image/')) {
          const base64Logo = await convertImageToBase64(edu.logo);
          if (base64Logo) {
            return { ...edu, logo: base64Logo };
          }
        }
        return edu;
      })
    );
  }

  // Convert license and certificate logos
  if (profile.licenseAndCertificates && Array.isArray(profile.licenseAndCertificates)) {
    processedProfile.licenseAndCertificates = await Promise.all(
      profile.licenseAndCertificates.map(async (cert: any) => {
        if (cert.logo && !cert.logo.startsWith('data:image/')) {
          const base64Logo = await convertImageToBase64(cert.logo);
          if (base64Logo) {
            return { ...cert, logo: base64Logo };
          }
        }
        return cert;
      })
    );
  }

  return processedProfile;
};