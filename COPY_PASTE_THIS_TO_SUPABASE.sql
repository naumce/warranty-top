-- ============================================
-- COMPLETE DATABASE SETUP
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click RUN
-- ============================================

-- ============================================
-- MIGRATION 1: Create base warranties table
-- ============================================

-- Create warranties table
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
-- MIGRATION 2: Add enhanced features
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

-- Create warranty_documents table for PDFs, manuals, etc.
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

-- Create warranty_reminders table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.warranty_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warranty_id UUID NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS on new tables
ALTER TABLE public.warranty_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for warranty_images
CREATE POLICY "Users can view images of their warranties"
  ON public.warranty_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_images.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload images to their warranties"
  ON public.warranty_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_images.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images of their warranties"
  ON public.warranty_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_images.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of their warranties"
  ON public.warranty_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_images.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

-- Policies for warranty_documents
CREATE POLICY "Users can view documents of their warranties"
  ON public.warranty_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_documents.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents to their warranties"
  ON public.warranty_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_documents.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents of their warranties"
  ON public.warranty_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_documents.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents of their warranties"
  ON public.warranty_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.warranties
      WHERE warranties.id = warranty_documents.warranty_id
      AND warranties.user_id = auth.uid()
    )
  );

-- Policies for warranty_reminders
CREATE POLICY "Users can view their own reminders"
  ON public.warranty_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create reminders"
  ON public.warranty_reminders
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warranty_images_warranty_id ON public.warranty_images(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_images_type ON public.warranty_images(image_type);
CREATE INDEX IF NOT EXISTS idx_warranty_documents_warranty_id ON public.warranty_documents(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reminders_warranty_id ON public.warranty_reminders(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_reminders_user_id ON public.warranty_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_warranties_tags ON public.warranties USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_warranties_reminder_enabled ON public.warranties(reminder_enabled) WHERE reminder_enabled = true;

-- Function to get warranty statistics for a user
CREATE OR REPLACE FUNCTION public.get_user_warranty_stats(p_user_id UUID)
RETURNS TABLE (
  total_warranties INTEGER,
  active_warranties INTEGER,
  expiring_soon INTEGER,
  expired INTEGER,
  total_value NUMERIC,
  total_images INTEGER,
  total_documents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_warranties,
    COUNT(*) FILTER (WHERE warranty_end_date > CURRENT_DATE + INTERVAL '30 days')::INTEGER as active_warranties,
    COUNT(*) FILTER (WHERE warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::INTEGER as expiring_soon,
    COUNT(*) FILTER (WHERE warranty_end_date < CURRENT_DATE)::INTEGER as expired,
    COALESCE(SUM(purchase_price), 0) as total_value,
    (SELECT COUNT(*)::INTEGER FROM public.warranty_images wi 
     JOIN public.warranties w ON wi.warranty_id = w.id 
     WHERE w.user_id = p_user_id) as total_images,
    (SELECT COUNT(*)::INTEGER FROM public.warranty_documents wd 
     JOIN public.warranties w ON wd.warranty_id = w.id 
     WHERE w.user_id = p_user_id) as total_documents
  FROM public.warranties
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to mark primary image
CREATE OR REPLACE FUNCTION public.set_primary_warranty_image(p_image_id UUID)
RETURNS void AS $$
DECLARE
  v_warranty_id UUID;
BEGIN
  SELECT warranty_id INTO v_warranty_id
  FROM public.warranty_images
  WHERE id = p_image_id;

  UPDATE public.warranty_images
  SET is_primary = false
  WHERE warranty_id = v_warranty_id;

  UPDATE public.warranty_images
  SET is_primary = true
  WHERE id = p_image_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comments for documentation
COMMENT ON TABLE public.warranty_images IS 'Stores product photos, receipt images, and damage documentation';
COMMENT ON TABLE public.warranty_documents IS 'Stores warranty certificates, manuals, and other PDF documents';
COMMENT ON TABLE public.warranty_reminders IS 'Tracks sent warranty expiration reminders';
COMMENT ON COLUMN public.warranties.receipt_ocr_data IS 'Raw OCR extracted data from receipt in JSON format';
COMMENT ON COLUMN public.warranties.tags IS 'User-defined tags for organizing warranties';
COMMENT ON COLUMN public.warranties.reminder_days_before IS 'Array of days before expiry to send reminders (default: 30, 14, 7)';

-- ============================================
-- SUCCESS!
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ ✅ ✅ DATABASE SETUP COMPLETE! ✅ ✅ ✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  ✓ warranties (with all enhanced columns)';
  RAISE NOTICE '  ✓ warranty_images';
  RAISE NOTICE '  ✓ warranty_documents';
  RAISE NOTICE '  ✓ warranty_reminders';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test your app at http://localhost:8082';
END $$;

