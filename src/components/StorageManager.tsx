import React, { useState, useEffect } from 'react';
import { ImageStorageService } from '../utils/imageStorage';
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  Image, 
  AlertCircle, 
  CheckCircle,
  Database,
  Loader2
} from 'lucide-react';

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  bucketExists: boolean;
}

export const StorageManager: React.FC = () => {
  const [stats, setStats] = useState<StorageStats>({ totalFiles: 0, totalSize: 0, bucketExists: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStats();
    initializeBucket();
  }, []);

  const initializeBucket = async () => {
    try {
      await ImageStorageService.initializeBucket();
      await loadStats();
    } catch (error) {
      console.error('Error initializing bucket:', error);
      setMessage({ type: 'error', text: 'Failed to initialize storage bucket' });
    }
  };

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const storageStats = await ImageStorageService.getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
      setMessage({ type: 'error', text: 'Failed to load storage statistics' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to clean up orphaned images? This action cannot be undone.')) {
      return;
    }

    setIsCleaningUp(true);
    setMessage(null);

    try {
      const deletedCount = await ImageStorageService.cleanupOrphanedImages();
      setMessage({ 
        type: 'success', 
        text: `Successfully cleaned up ${deletedCount} orphaned images` 
      });
      await loadStats();
    } catch (error) {
      console.error('Error during cleanup:', error);
      setMessage({ type: 'error', text: 'Failed to clean up orphaned images' });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <HardDrive className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Storage Management</h3>
            <p className="text-gray-600">Manage profile images and storage optimization</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleCleanup}
            disabled={isCleaningUp || !stats.bucketExists}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isCleaningUp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {isCleaningUp ? 'Cleaning...' : 'Cleanup Orphaned'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Storage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Image className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : stats.totalFiles.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Images</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <HardDrive className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : formatFileSize(stats.totalSize)}
              </div>
              <div className="text-sm text-gray-600">Storage Used</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${stats.bucketExists ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? '...' : (stats.bucketExists ? 'Active' : 'Inactive')}
              </div>
              <div className="text-sm text-gray-600">Storage Bucket</div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Image Storage Optimization</h4>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Profile images are automatically uploaded to Supabase Storage for permanent URLs</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Images are optimized and compressed to reduce storage costs</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Orphaned images can be cleaned up to free storage space</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>All images are served from a global CDN for fast loading</span>
          </div>
        </div>
      </div>

      {/* Storage Limits */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <div className="font-medium mb-1">Storage Limits</div>
            <ul className="space-y-1">
              <li>• Maximum file size: 5MB per image</li>
              <li>• Supported formats: JPEG, PNG, WebP</li>
              <li>• Supabase free tier: 1GB storage included</li>
              <li>• Images are automatically optimized for web delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};