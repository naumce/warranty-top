# 🗄️ Supabase Storage Setup Guide

The warranty tracker needs Supabase Storage buckets to store images and documents.

## Step 1: Run the Database Migration

First, apply the new database schema that adds support for images, documents, and receipt OCR:

```bash
cd /Users/naum/Desktop/warr/warranty-bot-main

# If you have Supabase CLI installed:
supabase db push

# OR manually run the migration in Supabase dashboard
```

The migration file is located at:
```
supabase/migrations/20251028120000_add_images_and_documents.sql
```

### What the Migration Creates:

- **New columns on `warranties` table:**
  - `receipt_number`, `order_number`, `purchase_method`
  - `store_address`, `store_city`, `store_country`, `store_phone`
  - `warranty_type`, `condition_at_purchase`
  - `reminder_enabled`, `reminder_days_before[]`
  - `tags[]`, `receipt_ocr_data`

- **New tables:**
  - `warranty_images` - stores product photos, receipts, damage docs
  - `warranty_documents` - stores PDFs, manuals, certificates
  - `warranty_reminders` - tracks sent notifications

## Step 2: Create Storage Buckets

### Method A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**

#### Create Bucket #1: `warranty-images`
- **Name:** `warranty-images`
- **Public:** ✅ Yes (for displaying images)
- **File size limit:** 10 MB
- **Allowed MIME types:** 
  - `image/jpeg`
  - `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/heic`

#### Create Bucket #2: `warranty-documents`
- **Name:** `warranty-documents`
- **Public:** ✅ Yes (for downloading documents)
- **File size limit:** 25 MB
- **Allowed MIME types:**
  - `application/pdf`
  - `image/jpeg`
  - `image/png`

### Method B: Using Supabase CLI

```sql
-- Run these in Supabase SQL Editor

-- Create warranty-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'warranty-images',
  'warranty-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
);

-- Create warranty-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'warranty-documents',
  'warranty-documents',
  true,
  26214400, -- 25MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
);
```

## Step 3: Set Storage Policies (IMPORTANT!)

Storage buckets need RLS (Row Level Security) policies so users can only access their own files.

### Run this SQL in Supabase SQL Editor:

```sql
-- Policy: Users can upload images to their warranties
CREATE POLICY "Users can upload warranty images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'warranty-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.warranties WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view images from their warranties
CREATE POLICY "Users can view warranty images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'warranty-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.warranties WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete images from their warranties
CREATE POLICY "Users can delete warranty images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'warranty-images' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.warranties WHERE user_id = auth.uid()
  )
);

-- Policy: Users can upload documents to their warranties
CREATE POLICY "Users can upload warranty documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'warranty-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.warranties WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view documents from their warranties
CREATE POLICY "Users can view warranty documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'warranty-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.warranties WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete documents from their warranties
CREATE POLICY "Users can delete warranty documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'warranty-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.warranties WHERE user_id = auth.uid()
  )
);
```

## Step 4: Test the Setup

After setting up, test by:

1. **Adding a warranty** with a receipt image
2. **Uploading a product photo**
3. **Attaching a PDF** (warranty certificate or manual)

Check the Supabase Storage dashboard to see files being uploaded!

## Folder Structure

Files are organized by warranty ID:

```
warranty-images/
  ├── {warranty-id}/
  │   ├── receipt_1698765432.jpg
  │   ├── product_1698765435.jpg
  │   ├── damage_1698765438.jpg
  │   └── packaging_1698765440.jpg

warranty-documents/
  ├── {warranty-id}/
  │   ├── warranty_certificate_1698765450.pdf
  │   ├── manual_1698765455.pdf
  │   └── invoice_1698765460.pdf
```

## Troubleshooting

### "Permission denied" errors
- Check that RLS policies are created correctly
- Verify user is authenticated
- Ensure bucket names match exactly: `warranty-images` and `warranty-documents`

### Images not displaying
- Verify buckets are set to **public**
- Check file MIME types are allowed
- Inspect browser console for CORS errors

### Upload fails
- Check file size limits (10MB for images, 25MB for docs)
- Verify MIME type is allowed
- Check browser console for detailed error

## Cost Considerations

**Supabase Free Tier:**
- 1 GB storage
- 2 GB bandwidth per month

**Estimated usage per user (100 warranties):**
- ~100 receipts @ 500KB each = 50 MB
- ~100 product photos @ 1MB each = 100 MB
- ~20 PDFs @ 2MB each = 40 MB
- **Total: ~200 MB per active user**

For production, consider upgrading to Supabase Pro for more storage.

## Security Notes

✅ **Good practices:**
- Files are organized by warranty_id (UUID) - hard to guess
- RLS policies ensure users only access their own files
- File size limits prevent abuse
- MIME type restrictions prevent malicious uploads

❌ **Additional hardening (optional):**
- Add virus scanning (use Supabase Edge Functions + ClamAV)
- Implement rate limiting on uploads
- Add watermarks to images (prevent theft)
- Compress images server-side (save storage costs)

## Next Steps

After setup:
1. ✅ Run migration
2. ✅ Create storage buckets
3. ✅ Add RLS policies
4. 📸 Test receipt OCR with real receipts
5. 🖼️ Upload product images
6. 📄 Attach warranty documents

Your warranty tracker is now ready to handle real files! 🚀

