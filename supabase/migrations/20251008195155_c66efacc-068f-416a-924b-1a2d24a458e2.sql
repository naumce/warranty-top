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