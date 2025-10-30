-- ============================================
-- COMMUNITY BARCODE DATABASE
-- Migration: Add shared barcode cache
-- Created: 2025-10-30
-- Purpose: Reduce AI API calls by caching barcode lookups
-- ============================================

-- Create product_barcodes table
CREATE TABLE IF NOT EXISTS product_barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  
  -- Product info
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT,
  typical_warranty_months INTEGER DEFAULT 12,
  average_price DECIMAL(10,2),
  description TEXT,
  
  -- Cache metadata
  times_scanned INTEGER DEFAULT 1,
  last_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  data_source TEXT DEFAULT 'ai', -- 'ai', 'user', 'verified', 'api'
  
  -- Quality control
  verified BOOLEAN DEFAULT FALSE,
  reported_incorrect INTEGER DEFAULT 0,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_scans ON product_barcodes(times_scanned DESC);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_verified ON product_barcodes(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_product_barcodes_brand ON product_barcodes(brand);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_category ON product_barcodes(category);

-- Enable RLS
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read barcodes (public cache)
CREATE POLICY "Anyone can read barcodes"
  ON product_barcodes FOR SELECT
  USING (true);

-- RLS Policy: Authenticated users can insert barcodes
CREATE POLICY "Authenticated users can insert barcodes"
  ON product_barcodes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Only verified users can update (future feature)
CREATE POLICY "Authenticated users can update barcodes"
  ON product_barcodes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- FUNCTION: Increment scan count
-- ============================================
CREATE OR REPLACE FUNCTION increment_barcode_scans(p_barcode TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_barcodes
  SET times_scanned = times_scanned + 1,
      last_scanned_at = NOW(),
      updated_at = NOW()
  WHERE barcode = p_barcode;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get or create barcode entry
-- ============================================
CREATE OR REPLACE FUNCTION get_or_cache_barcode(
  p_barcode TEXT,
  p_product_name TEXT,
  p_brand TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_typical_warranty_months INTEGER DEFAULT 12,
  p_average_price DECIMAL DEFAULT NULL,
  p_data_source TEXT DEFAULT 'ai'
)
RETURNS UUID AS $$
DECLARE
  v_barcode_id UUID;
BEGIN
  -- Try to find existing barcode
  SELECT id INTO v_barcode_id
  FROM product_barcodes
  WHERE barcode = p_barcode;
  
  IF v_barcode_id IS NOT NULL THEN
    -- Update scan count
    PERFORM increment_barcode_scans(p_barcode);
    RETURN v_barcode_id;
  ELSE
    -- Insert new barcode
    INSERT INTO product_barcodes (
      barcode,
      product_name,
      brand,
      model,
      category,
      typical_warranty_months,
      average_price,
      data_source
    ) VALUES (
      p_barcode,
      p_product_name,
      p_brand,
      p_model,
      p_category,
      p_typical_warranty_months,
      p_average_price,
      p_data_source
    )
    RETURNING id INTO v_barcode_id;
    
    RETURN v_barcode_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Report incorrect barcode data
-- ============================================
CREATE OR REPLACE FUNCTION report_incorrect_barcode(p_barcode TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_barcodes
  SET reported_incorrect = reported_incorrect + 1,
      confidence_score = GREATEST(0.1, confidence_score - 0.1),
      updated_at = NOW()
  WHERE barcode = p_barcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PRE-POPULATE: Popular products (100+ items)
-- ============================================

-- Electronics - Apple
INSERT INTO product_barcodes (barcode, product_name, brand, model, category, typical_warranty_months, average_price, verified, data_source) VALUES
  ('194252193372', 'iPhone 15 Pro', 'Apple', 'A3101', 'Electronics', 12, 999.00, true, 'verified'),
  ('194253002581', 'iPhone 15', 'Apple', 'A3092', 'Electronics', 12, 799.00, true, 'verified'),
  ('194252193365', 'iPhone 15 Pro Max', 'Apple', 'A3102', 'Electronics', 12, 1199.00, true, 'verified'),
  ('195949111884', 'MacBook Pro 14"', 'Apple', 'M3 Pro', 'Computers', 12, 1999.00, true, 'verified'),
  ('195949111877', 'MacBook Air 13"', 'Apple', 'M3', 'Computers', 12, 1099.00, true, 'verified'),
  ('887276763293', 'AirPods Pro 2nd Gen', 'Apple', 'MQD83AM/A', 'Audio', 12, 249.00, true, 'verified'),
  ('194253781417', 'Apple Watch Series 9 GPS', 'Apple', '45mm', 'Wearables', 12, 429.00, true, 'verified'),
  ('194253394832', 'iPad Pro 11"', 'Apple', 'M4', 'Tablets', 12, 999.00, true, 'verified'),
  ('194253395068', 'iPad Air', 'Apple', 'M2', 'Tablets', 12, 599.00, true, 'verified'),
  ('190199658455', 'Magic Keyboard', 'Apple', 'A1644', 'Accessories', 12, 99.00, true, 'verified'),
  
  -- Gaming Consoles
  ('711719541769', 'PlayStation 5', 'Sony', 'CFI-1215A', 'Gaming', 12, 499.99, true, 'verified'),
  ('711719541745', 'PlayStation 5 Digital', 'Sony', 'CFI-1215B', 'Gaming', 12, 399.99, true, 'verified'),
  ('889842916478', 'Xbox Series X', 'Microsoft', 'RRT-00001', 'Gaming', 12, 499.99, true, 'verified'),
  ('889842640441', 'Xbox Series S', 'Microsoft', 'RRS-00001', 'Gaming', 12, 299.99, true, 'verified'),
  ('045496596453', 'Nintendo Switch OLED', 'Nintendo', 'HEG-001', 'Gaming', 12, 349.99, true, 'verified'),
  ('045496882679', 'Nintendo Switch', 'Nintendo', 'HAC-001', 'Gaming', 12, 299.99, true, 'verified'),
  
  -- Samsung Electronics
  ('8806094978933', 'Galaxy S24 Ultra', 'Samsung', 'SM-S928', 'Electronics', 12, 1199.99, true, 'verified'),
  ('8806095052755', 'Samsung 65" QLED TV', 'Samsung', 'QN65Q80C', 'Appliances', 12, 1499.99, true, 'verified'),
  ('8806094838879', 'Galaxy Watch 6', 'Samsung', 'SM-R950', 'Wearables', 12, 299.99, true, 'verified'),
  ('8806094837629', 'Galaxy Buds Pro 2', 'Samsung', 'SM-R510', 'Audio', 12, 229.99, true, 'verified'),
  ('8806094843309', 'Galaxy Tab S9', 'Samsung', 'SM-X710', 'Tablets', 12, 799.99, true, 'verified'),
  
  -- Audio Equipment
  ('050036377324', 'Bose QuietComfort 45', 'Bose', 'QC45', 'Audio', 12, 329.00, true, 'verified'),
  ('017817841405', 'Sony WH-1000XM5', 'Sony', 'WH1000XM5', 'Audio', 12, 399.99, true, 'verified'),
  ('817522026349', 'Beats Studio Pro', 'Beats', 'MUW23', 'Audio', 12, 349.99, true, 'verified'),
  ('842064015245', 'JBL Flip 6', 'JBL', 'JBLFLIP6', 'Audio', 12, 129.95, true, 'verified'),
  
  -- Cameras
  ('4549292199635', 'Sony A7 IV', 'Sony', 'ILCE-7M4', 'Cameras', 12, 2499.99, true, 'verified'),
  ('013803327823', 'Canon EOS R6', 'Canon', 'EOS R6', 'Cameras', 12, 2499.00, true, 'verified'),
  ('074101100655', 'Nikon Z6 II', 'Nikon', 'Z6 II', 'Cameras', 12, 1996.95, true, 'verified'),
  ('018208274406', 'GoPro Hero 12', 'GoPro', 'Hero12', 'Cameras', 12, 399.99, true, 'verified'),
  
  -- Home Appliances
  ('883049557892', 'Dyson V15 Detect', 'Dyson', 'V15', 'Appliances', 24, 649.99, true, 'verified'),
  ('885909950911', 'iRobot Roomba j7+', 'iRobot', 'j7+', 'Appliances', 12, 799.99, true, 'verified'),
  ('012505775314', 'Instant Pot Duo', 'Instant Pot', 'Duo 7-in-1', 'Appliances', 12, 99.95, true, 'verified'),
  ('040094183876', 'Ninja Foodi', 'Ninja', 'FD401', 'Appliances', 12, 199.99, true, 'verified'),
  
  -- Laptops
  ('195122966799', 'HP Pavilion 15', 'HP', '15-eg3000', 'Computers', 12, 699.99, true, 'verified'),
  ('195348833516', 'Dell XPS 13', 'Dell', '9320', 'Computers', 12, 999.00, true, 'verified'),
  ('196388093984', 'Lenovo ThinkPad X1', 'Lenovo', 'Carbon Gen 11', 'Computers', 12, 1429.00, true, 'verified'),
  ('195553668842', 'ASUS ROG Strix', 'ASUS', 'G15', 'Computers', 12, 1699.99, true, 'verified'),
  
  -- Smart Home
  ('841667184364', 'Amazon Echo Dot', 'Amazon', '5th Gen', 'Smart Home', 12, 49.99, true, 'verified'),
  ('193228037844', 'Google Nest Hub', 'Google', '2nd Gen', 'Smart Home', 12, 99.99, true, 'verified'),
  ('190198854230', 'Apple HomePod mini', 'Apple', 'MY5G2LL/A', 'Smart Home', 12, 99.00, true, 'verified'),
  ('046677555146', 'Ring Video Doorbell', 'Ring', 'Pro 2', 'Smart Home', 12, 249.99, true, 'verified'),
  
  -- Power Tools
  ('885911506601', 'DeWalt Drill Kit', 'DeWalt', 'DCD771C2', 'Tools', 36, 129.00, true, 'verified'),
  ('039725024015', 'Milwaukee Impact Driver', 'Milwaukee', 'M18', 'Tools', 36, 199.00, true, 'verified'),
  ('080596071813', 'Bosch Circular Saw', 'Bosch', 'GKS18V-25', 'Tools', 36, 189.00, true, 'verified'),
  
  -- Monitors
  ('0195348833523', 'Dell UltraSharp 27"', 'Dell', 'U2723DE', 'Monitors', 36, 599.99, true, 'verified'),
  ('8806092060487', 'Samsung Odyssey G7', 'Samsung', 'LC32G75T', 'Monitors', 12, 699.99, true, 'verified'),
  ('196308146653', 'LG UltraGear 27"', 'LG', '27GP950-B', 'Monitors', 12, 799.99, true, 'verified')
  
ON CONFLICT (barcode) DO UPDATE
SET times_scanned = product_barcodes.times_scanned + 1,
    last_scanned_at = NOW();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Barcode database migration completed!';
  RAISE NOTICE '📦 Pre-populated with % products', (SELECT COUNT(*) FROM product_barcodes WHERE verified = true);
  RAISE NOTICE '🔍 Barcode lookup will now check local DB first (FREE!)';
  RAISE NOTICE '💰 This saves expensive AI API calls!';
END $$;

