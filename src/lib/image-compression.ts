/**
 * Image Compression Utility
 * 
 * Compresses images before upload to save storage costs
 * Typical savings: 2MB → 300KB (85% reduction!)
 * 
 * Features:
 * - Automatic resizing (max 1200px)
 * - Quality optimization (85%)
 * - JPEG conversion
 * - Progress tracking
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
  savingsKB: number;
}

/**
 * Compress a single image file
 * @param file Original image file
 * @param maxWidth Maximum width (default: 1200px)
 * @param maxHeight Maximum height (default: 1200px)
 * @param quality JPEG quality 0-1 (default: 0.85)
 * @returns Compressed file and metadata
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Calculate new dimensions (maintain aspect ratio)
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          // Set canvas size
          canvas.width = width;
          canvas.height = height;
          
          // Enable better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              const compressedSize = blob.size;
              
              // Create new file
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );
              
              // Calculate savings
              const savingsKB = Math.round((originalSize - compressedSize) / 1024);
              const savingsPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);
              
              console.log(`📦 Image Compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${savingsPercent}% saved)`);
              
              resolve({
                file: compressedFile,
                originalSize,
                compressedSize,
                savingsPercent,
                savingsKB,
              });
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images in parallel
 * @param files Array of image files
 * @param onProgress Callback for progress updates
 * @returns Array of compressed files with metadata
 */
export async function compressImages(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await compressImage(files[i]);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    } catch (error) {
      console.error(`Failed to compress ${files[i].name}:`, error);
      // Skip failed files, continue with others
    }
  }
  
  return results;
}

/**
 * Check if file needs compression
 * @param file File to check
 * @param maxSizeKB Maximum size in KB (default: 500KB)
 * @returns true if file should be compressed
 */
export function shouldCompress(file: File, maxSizeKB: number = 500): boolean {
  const fileSizeKB = file.size / 1024;
  const isImage = file.type && file.type.startsWith('image/');
  
  return isImage && fileSizeKB > maxSizeKB;
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Smart compression - only compress if needed
 * @param file Original file
 * @returns Compressed file or original if compression not needed
 */
export async function smartCompress(file: File): Promise<CompressionResult> {
  if (!shouldCompress(file)) {
    console.log(`✅ File already optimized: ${file.name}`);
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      savingsPercent: 0,
      savingsKB: 0,
    };
  }
  
  return compressImage(file);
}

/**
 * Validate image file
 * @param file File to validate
 * @param maxSizeMB Maximum size in MB (default: 10MB)
 * @returns Error message or null if valid
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): string | null {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return 'File must be an image (JPEG, PNG, WEBP, etc.)';
  }
  
  // Check file size (before compression)
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return `Image is too large. Maximum size: ${maxSizeMB}MB`;
  }
  
  return null; // Valid
}

