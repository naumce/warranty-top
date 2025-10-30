-- ============================================
-- COMPLETE SUPABASE SETUP FOR WARRANTY TRACKER
-- Copy this ENTIRE file and run in Supabase SQL Editor
-- ============================================

-- PART 1: Create Original Warranties Table
-- ============================================

CREATE TABLE public.warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE NOT NULL,
  warranty_end_date DATE NOT NULL,
  store_name TEXT,
  purchase_price NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

-- Create policies for users to manage their own warranties
CREATE POLICY "Users can view their own warranties"
  ON public.warranties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own warranties"
  ON public.warranties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warranties"
  ON public.warranties
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own warranties"
  ON public.warranties
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_warranties_updated_at
  BEFORE UPDATE ON public.warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_warranties_user_id ON public.warranties(user_id);
CREATE INDEX idx_warranties_warranty_end_date ON public.warranties(warranty_end_date);

-- ============================================
-- PART 2: Add Enhanced Features
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

CREATE POLICY "Users can update images of their warranties"
ON public.warranty_images FOR UPDATE
USING (
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

-- Policies for warranty_documents (same pattern)
CREATE POLICY "Users can view documents of their warranties"
ON public.warranty_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.warranties
    WHERE warranties.id = warranty_documents.warranty_id
    AND warranties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents to their warranties"
ON public.warranty_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.warranties
    WHERE warranties.id = warranty_documents.warranty_id
    AND warranties.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents of their warranties"
ON public.warranty_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.warranties
    WHERE warranties.id = warranty_documents.warranty_id
    AND warranties.user_id = auth.uid()
  )
);

-- Policies for warranty_reminders
CREATE POLICY "Users can view their own reminders"
ON public.warranty_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create reminders"
ON public.warranty_reminders FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warranty_images_warranty_id ON public.warranty_images(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_documents_warranty_id ON public.warranty_documents(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reminders_warranty_id ON public.warranty_reminders(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranties_tags ON public.warranties USING GIN(tags);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ ✅ ✅ Database setup completed successfully! ✅ ✅ ✅';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - warranties (with enhanced columns)';
  RAISE NOTICE '  - warranty_images';
  RAISE NOTICE '  - warranty_documents';
  RAISE NOTICE '  - warranty_reminders';
  RAISE NOTICE 'Next step: Create storage buckets in Supabase dashboard';
END $$;

