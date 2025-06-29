import { supabase } from '../lib/supabase';

export interface ImageUploadResult {
  url: string;
  path: string;
  error?: string;
}

export class ImageStorageService {
  private static readonly BUCKET_NAME = 'profile-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Initialize the storage bucket (call this once during app setup)
   */
  static async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        console.warn(`Storage bucket '${this.BUCKET_NAME}' does not exist. Please create it manually in your Supabase dashboard.`);
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }

  /**
   * Upload image from URL to Supabase Storage
   */
  static async uploadImageFromUrl(imageUrl: string, fileName: string): Promise<ImageUploadResult> {
    try {
      // Skip if already a Supabase URL
      if (imageUrl.includes('.supabase.co/storage/')) {
        return { url: imageUrl, path: fileName };
      }

      // Skip if it's a data URL (base64)
      if (imageUrl.startsWith('data:image/')) {
        return { url: imageUrl, path: fileName };
      }

      // Fetch the image
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'LinkedIn-Scraper/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      // Validate file type
      if (!this.ALLOWED_TYPES.includes(blob.type)) {
        throw new Error(`Unsupported image type: ${blob.type}`);
      }

      // Validate file size
      if (blob.size > this.MAX_FILE_SIZE) {
        throw new Error(`Image too large: ${blob.size} bytes (max: ${this.MAX_FILE_SIZE})`);
      }

      // Generate unique file path
      const fileExtension = blob.type.split('/')[1];
      const uniqueFileName = `${fileName}-${Date.now()}.${fileExtension}`;
      const filePath = `profiles/${uniqueFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        url: imageUrl, // Fallback to original URL
        path: fileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Upload image file to Supabase Storage
   */
  static async uploadImageFile(file: File, fileName: string): Promise<ImageUploadResult> {
    try {
      // Validate file type
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Unsupported image type: ${file.type}`);
      }

      // Validate file size
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`Image too large: ${file.size} bytes (max: ${this.MAX_FILE_SIZE})`);
      }

      // Generate unique file path
      const fileExtension = file.type.split('/')[1];
      const uniqueFileName = `${fileName}-${Date.now()}.${fileExtension}`;
      const filePath = `profiles/${uniqueFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Error uploading image file:', error);
      return {
        url: '',
        path: fileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process profile data and optimize images
   */
  static async optimizeProfileImages(profileData: any, profileId: string): Promise<any> {
    const optimizedProfile = { ...profileData };
    const uploadPromises: Promise<void>[] = [];

    // Process main profile picture
    if (profileData.profilePic && !profileData.profilePic.startsWith('data:image/') && !profileData.profilePic.includes('.supabase.co/storage/')) {
      uploadPromises.push(
        this.uploadImageFromUrl(profileData.profilePic, `${profileId}-profile`)
          .then(result => {
            if (!result.error) {
              optimizedProfile.profilePic = result.url;
              optimizedProfile.profilePicStoragePath = result.path;
            }
          })
      );
    }

    // Process high quality profile picture
    if (profileData.profilePicHighQuality && !profileData.profilePicHighQuality.startsWith('data:image/') && !profileData.profilePicHighQuality.includes('.supabase.co/storage/')) {
      uploadPromises.push(
        this.uploadImageFromUrl(profileData.profilePicHighQuality, `${profileId}-profile-hq`)
          .then(result => {
            if (!result.error) {
              optimizedProfile.profilePicHighQuality = result.url;
              optimizedProfile.profilePicHighQualityStoragePath = result.path;
            }
          })
      );
    }

    // Process experience company logos
    if (profileData.experiences && Array.isArray(profileData.experiences)) {
      profileData.experiences.forEach((exp: any, index: number) => {
        if (exp.logo && !exp.logo.startsWith('data:image/') && !exp.logo.includes('.supabase.co/storage/')) {
          uploadPromises.push(
            this.uploadImageFromUrl(exp.logo, `${profileId}-exp-${index}`)
              .then(result => {
                if (!result.error) {
                  optimizedProfile.experiences[index].logo = result.url;
                  optimizedProfile.experiences[index].logoStoragePath = result.path;
                }
              })
          );
        }
      });
    }

    // Process education logos
    if (profileData.educations && Array.isArray(profileData.educations)) {
      profileData.educations.forEach((edu: any, index: number) => {
        if (edu.logo && !edu.logo.startsWith('data:image/') && !edu.logo.includes('.supabase.co/storage/')) {
          uploadPromises.push(
            this.uploadImageFromUrl(edu.logo, `${profileId}-edu-${index}`)
              .then(result => {
                if (!result.error) {
                  optimizedProfile.educations[index].logo = result.url;
                  optimizedProfile.educations[index].logoStoragePath = result.path;
                }
              })
          );
        }
      });
    }

    // Process license and certificate logos
    if (profileData.licenseAndCertificates && Array.isArray(profileData.licenseAndCertificates)) {
      profileData.licenseAndCertificates.forEach((cert: any, index: number) => {
        if (cert.logo && !cert.logo.startsWith('data:image/') && !cert.logo.includes('.supabase.co/storage/')) {
          uploadPromises.push(
            this.uploadImageFromUrl(cert.logo, `${profileId}-cert-${index}`)
              .then(result => {
                if (!result.error) {
                  optimizedProfile.licenseAndCertificates[index].logo = result.url;
                  optimizedProfile.licenseAndCertificates[index].logoStoragePath = result.path;
                }
              })
          );
        }
      });
    }

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);

    // Add metadata about optimization
    optimizedProfile._imageOptimization = {
      optimizedAt: new Date().toISOString(),
      totalImages: uploadPromises.length,
      version: '1.0'
    };

    return optimizedProfile;
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Clean up orphaned images (images not referenced by any profile)
   */
  static async cleanupOrphanedImages(): Promise<number> {
    try {
      // Get all images in storage
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('profiles');

      if (listError || !files) {
        console.error('Error listing files:', listError);
        return 0;
      }

      // Get all profile data to check references
      const { data: profiles, error: profilesError } = await supabase
        .from('linkedin_profiles')
        .select('profile_data');

      if (profilesError || !profiles) {
        console.error('Error fetching profiles:', profilesError);
        return 0;
      }

      // Extract all storage paths from profiles
      const referencedPaths = new Set<string>();
      profiles.forEach(profile => {
        const data = profile.profile_data;
        
        // Check main profile images
        if (data.profilePicStoragePath) referencedPaths.add(data.profilePicStoragePath);
        if (data.profilePicHighQualityStoragePath) referencedPaths.add(data.profilePicHighQualityStoragePath);
        
        // Check experience logos
        if (data.experiences) {
          data.experiences.forEach((exp: any) => {
            if (exp.logoStoragePath) referencedPaths.add(exp.logoStoragePath);
          });
        }
        
        // Check education logos
        if (data.educations) {
          data.educations.forEach((edu: any) => {
            if (edu.logoStoragePath) referencedPaths.add(edu.logoStoragePath);
          });
        }
        
        // Check certificate logos
        if (data.licenseAndCertificates) {
          data.licenseAndCertificates.forEach((cert: any) => {
            if (cert.logoStoragePath) referencedPaths.add(cert.logoStoragePath);
          });
        }
      });

      // Find orphaned files
      const orphanedFiles = files.filter(file => {
        const fullPath = `profiles/${file.name}`;
        return !referencedPaths.has(fullPath);
      });

      // Delete orphaned files
      if (orphanedFiles.length > 0) {
        const pathsToDelete = orphanedFiles.map(file => `profiles/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(pathsToDelete);

        if (deleteError) {
          console.error('Error deleting orphaned files:', deleteError);
          return 0;
        }
      }

      console.log(`Cleaned up ${orphanedFiles.length} orphaned images`);
      return orphanedFiles.length;

    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    bucketExists: boolean;
  }> {
    try {
      // Check if bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME) || false;

      if (!bucketExists) {
        return { totalFiles: 0, totalSize: 0, bucketExists: false };
      }

      // Get all files
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('profiles');

      if (error || !files) {
        return { totalFiles: 0, totalSize: 0, bucketExists: true };
      }

      const totalFiles = files.length;
      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

      return { totalFiles, totalSize, bucketExists: true };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalFiles: 0, totalSize: 0, bucketExists: false };
    }
  }
}