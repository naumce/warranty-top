-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR NOW!
-- Go to: Dashboard → SQL Editor → New Query
-- Paste this entire file and click RUN
-- ============================================

-- Add new columns to warranties table
ALTER TABLE public.warranties
ADD COLUMN IF NOT EXISTS receipt_number TEXT,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS purchase_method TEXT,
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS store_city TEXT,
ADD COLUMN IF NOT EXISTS store_country TEXT,
ADD COLUMN IF NOT EXISTS store_phone TEXT,
ADD COLUMN IF NOT EXISTS warranty_type TEXT,
ADD COLUMN IF NOT EXISTS condition_at_purchase TEXT,
ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_days_before INTEGER[] DEFAULT ARRAY[30, 14, 7],
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS receipt_ocr_data JSONB;

-- Create warranty_images table for product photos
CREATE TABLE IF NOT EXISTS public.warranty_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  image_type TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  file_size INTEGER,
  mime_type TEXT
);

-- Create warranty_documents table
CREATE TABLE IF NOT EXISTS public.warranty_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_reminders table
CREATE TABLE IF NOT EXISTS public.warranty_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.warranty_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for warranty_images
CREATE POLICY "Users can view images of their warranties"
ON public.warranty_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.warranties
    WHERE warranties.id = warranty_images.warranty_id
    AND warranties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload images to their warranties"
ON public.warranty_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.warranties
    WHERE warranties.id = warranty_images.warranty_id
    AND warranties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete images of their warranties"
ON public.warranty_images FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.warranties
    WHERE warranties.id = warranty_images.warranty_id
    AND warranties.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warranty_images_warranty_id ON public.warranty_images(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_documents_warranty_id ON public.warranty_documents(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reminders_warranty_id ON public.warranty_reminders(warranty_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
END $$;

