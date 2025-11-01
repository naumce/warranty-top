// Supabase Storage utilities for warranty images and documents

import { supabase } from "@/integrations/supabase/client";
import { smartCompress, formatFileSize as formatFileSizeCompression, CompressionResult } from "./image-compression";

export const STORAGE_BUCKETS = {
  WARRANTY_IMAGES: 'warranty-images',
  WARRANTY_DOCUMENTS: 'warranty-documents',
} as const;

export type ImageType = 'product' | 'receipt' | 'damage' | 'packaging' | 'other';
export type DocumentType = 'warranty_certificate' | 'manual' | 'receipt' | 'invoice' | 'extended_warranty' | 'insurance' | 'other';

/**
 * Upload an image to Supabase Storage (with automatic compression)
 */
export async function uploadWarrantyImage(
  file: File,
  warrantyId: string,
  imageType: ImageType
): Promise<{ url: string; path: string; compressionResult?: CompressionResult } | null> {
  try {
    // 🔥 AUTO-COMPRESS IMAGE BEFORE UPLOAD
    console.log(`📦 Original size: ${formatFileSizeCompression(file.size)} (${file.type || 'unknown type'})`);
    const compressionResult = await smartCompress(file);
    const fileToUpload = compressionResult.file;
    
    if (compressionResult.savingsPercent > 0) {
      console.log(`💰 Saved ${compressionResult.savingsKB}KB (${compressionResult.savingsPercent}% reduction)`);
    }
    
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${warrantyId}/${imageType}_${Date.now()}.${fileExt}`;
    
    console.log(`📤 Uploading ${imageType} image:`, fileName);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.WARRANTY_IMAGES)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.WARRANTY_IMAGES)
      .getPublicUrl(data.path);

    console.log('✅ Image uploaded:', publicUrl);

    return {
      url: publicUrl,
      path: data.path,
      compressionResult,
    };
  } catch (error) {
    console.error('Upload image error:', error);
    return null;
  }
}

/**
 * Upload a document to Supabase Storage
 */
export async function uploadWarrantyDocument(
  file: File,
  warrantyId: string,
  documentType: DocumentType
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${warrantyId}/${documentType}_${Date.now()}.${fileExt}`;
    
    console.log(`📤 Uploading ${documentType} document:`, fileName);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.WARRANTY_DOCUMENTS)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.WARRANTY_DOCUMENTS)
      .getPublicUrl(data.path);

    console.log('✅ Document uploaded:', publicUrl);

    return {
      url: publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Upload document error:', error);
    return null;
  }
}

/**
 * Delete an image from storage
 */
export async function deleteWarrantyImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.WARRANTY_IMAGES)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete image error:', error);
    return false;
  }
}

/**
 * Delete a document from storage
 */
export async function deleteWarrantyDocument(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.WARRANTY_DOCUMENTS)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete document error:', error);
    return false;
  }
}

/**
 * Get all images for a warranty
 */
export async function getWarrantyImages(warrantyId: string) {
  const { data, error } = await supabase
    .from('warranty_images')
    .select('*')
    .eq('warranty_id', warrantyId)
    .order('is_primary', { ascending: false })
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Get images error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all documents for a warranty
 */
export async function getWarrantyDocuments(warrantyId: string) {
  const { data, error } = await supabase
    .from('warranty_documents')
    .select('*')
    .eq('warranty_id', warrantyId)
    .order('uploaded_at', { ascending: false});

  if (error) {
    console.error('Get documents error:', error);
    return [];
  }

  return data || [];
}

/**
 * Save image metadata to database
 */
export async function saveImageMetadata(
  warrantyId: string,
  imageUrl: string,
  storagePath: string,
  imageType: ImageType,
  caption?: string,
  isPrimary: boolean = false,
  fileSize?: number,
  mimeType?: string
) {
  const { data, error } = await supabase
    .from('warranty_images')
    .insert({
      warranty_id: warrantyId,
      image_url: imageUrl,
      storage_path: storagePath,
      image_type: imageType,
      caption: caption,
      is_primary: isPrimary,
      file_size: fileSize,
      mime_type: mimeType,
    })
    .select()
    .single();

  if (error) {
    console.error('Save image metadata error:', error);
    return null;
  }

  return data;
}

/**
 * Save document metadata to database
 */
export async function saveDocumentMetadata(
  warrantyId: string,
  documentUrl: string,
  storagePath: string,
  documentType: DocumentType,
  documentName: string,
  fileSize?: number,
  mimeType?: string
) {
  const { data, error } = await supabase
    .from('warranty_documents')
    .insert({
      warranty_id: warrantyId,
      document_url: documentUrl,
      storage_path: storagePath,
      document_type: documentType,
      document_name: documentName,
      file_size: fileSize,
      mime_type: mimeType,
    })
    .select()
    .single();

  if (error) {
    console.error('Save document metadata error:', error);
    return null;
  }

  return data;
}

/**
 * Validate file type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
  return validTypes.includes(file.type);
}

export function isValidDocumentType(file: File): boolean {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  return validTypes.includes(file.type);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

