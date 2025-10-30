-- ============================================
-- ADD TEST WARRANTIES FOR TESTING
-- Run this in Supabase SQL Editor after signing up
-- This creates 15 warranties with different expiration dates
-- ============================================

-- First, get your user_id (this will be used for all test warranties)
-- Your user_id will be inserted automatically below

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the most recent user (you, after sign up)
  SELECT id INTO v_user_id 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- If you want to use a specific user, uncomment and replace:
  -- v_user_id := 'YOUR-USER-ID-HERE'::UUID;

  RAISE NOTICE 'Creating test warranties for user: %', v_user_id;

  -- ============================================
  -- 1. EXPIRED WARRANTIES (Already passed)
  -- ============================================
  
  -- Expired 6 months ago
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'Sony PlayStation 5',
    'Sony',
    'CFI-1215A',
    CURRENT_DATE - INTERVAL '18 months',
    CURRENT_DATE - INTERVAL '6 months',
    'GameStop',
    499.99,
    '🔴 EXPIRED: Warranty ended 6 months ago'
  );

  -- Expired last week
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, store_city)
  VALUES (
    v_user_id,
    'Dell XPS 15 Laptop',
    'Dell',
    'XPS 15 9530',
    CURRENT_DATE - INTERVAL '13 months',
    CURRENT_DATE - INTERVAL '7 days',
    'Best Buy',
    1899.00,
    '🔴 EXPIRED: Just expired last week',
    'San Francisco'
  );

  -- Expired yesterday
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'iPhone 14 Pro',
    'Apple',
    'A2650',
    CURRENT_DATE - INTERVAL '13 months',
    CURRENT_DATE - INTERVAL '1 day',
    'Apple Store',
    1099.00,
    '🔴 EXPIRED: Warranty ended yesterday!'
  );

  -- ============================================
  -- 2. EXPIRING TODAY
  -- ============================================
  
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, store_address)
  VALUES (
    v_user_id,
    'Samsung 65" QLED TV',
    'Samsung',
    'QN65Q80C',
    CURRENT_DATE - INTERVAL '12 months',
    CURRENT_DATE,
    'Costco',
    1299.99,
    '🟡 EXPIRING TODAY! Last day of warranty',
    '1234 Warehouse Blvd'
  );

  -- ============================================
  -- 3. EXPIRING SOON (Critical - Within 7 days)
  -- ============================================
  
  -- Expires tomorrow
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, receipt_number)
  VALUES (
    v_user_id,
    'MacBook Pro 16"',
    'Apple',
    'M3 Max',
    CURRENT_DATE - INTERVAL '364 days',
    CURRENT_DATE + INTERVAL '1 day',
    'Apple Store',
    3499.00,
    '⚠️ URGENT: Expires tomorrow!',
    'APL-2024-12345'
  );

  -- Expires in 3 days
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'Nintendo Switch OLED',
    'Nintendo',
    'HEG-001',
    CURRENT_DATE - INTERVAL '362 days',
    CURRENT_DATE + INTERVAL '3 days',
    'Target',
    349.99,
    '⚠️ Expires in 3 days'
  );

  -- Expires in 7 days
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, store_city)
  VALUES (
    v_user_id,
    'Dyson V15 Vacuum',
    'Dyson',
    'V15',
    CURRENT_DATE - INTERVAL '358 days',
    CURRENT_DATE + INTERVAL '7 days',
    'Dyson Store',
    699.99,
    '⚠️ Expires in 1 week',
    'New York'
  );

  -- ============================================
  -- 4. EXPIRING THIS MONTH (Within 14-30 days)
  -- ============================================
  
  -- Expires in 14 days
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'LG OLED C3 55"',
    'LG',
    'OLED55C3PUA',
    CURRENT_DATE - INTERVAL '351 days',
    CURRENT_DATE + INTERVAL '14 days',
    'Best Buy',
    1496.99,
    '🟠 Expires in 2 weeks'
  );

  -- Expires in 21 days
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'AirPods Pro 2nd Gen',
    'Apple',
    'MQD83AM/A',
    CURRENT_DATE - INTERVAL '344 days',
    CURRENT_DATE + INTERVAL '21 days',
    'Apple Store',
    249.00,
    '🟠 Expires in 3 weeks'
  );

  -- Expires in 30 days
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, store_phone)
  VALUES (
    v_user_id,
    'Sony WH-1000XM5 Headphones',
    'Sony',
    'WH-1000XM5',
    CURRENT_DATE - INTERVAL '335 days',
    CURRENT_DATE + INTERVAL '30 days',
    'Amazon',
    399.99,
    '🟠 Expires in 30 days (1 month)',
    '1-888-280-4331'
  );

  -- ============================================
  -- 5. ACTIVE WARRANTIES (Safe for now)
  -- ============================================
  
  -- Expires in 2 months
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'Bose QuietComfort Earbuds',
    'Bose',
    'QC Earbuds II',
    CURRENT_DATE - INTERVAL '305 days',
    CURRENT_DATE + INTERVAL '60 days',
    'Bose Store',
    299.00,
    '✅ Active - Expires in 2 months'
  );

  -- Expires in 6 months
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, store_address, store_city)
  VALUES (
    v_user_id,
    'Herman Miller Aeron Chair',
    'Herman Miller',
    'Aeron Remastered',
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_DATE + INTERVAL '6 months',
    'Herman Miller Store',
    1495.00,
    '✅ Active - 12 year warranty, 6 months remaining',
    '855 E Middlefield Rd',
    'Mountain View'
  );

  -- Expires in 1 year
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes)
  VALUES (
    v_user_id,
    'Samsung Galaxy S24 Ultra',
    'Samsung',
    'SM-S928U',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    'Verizon',
    1299.99,
    '✅ Active - Just purchased today, full year ahead!'
  );

  -- Expires in 2 years
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, receipt_number)
  VALUES (
    v_user_id,
    'KitchenAid Stand Mixer',
    'KitchenAid',
    'KSM150PSER',
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '23 months',
    'Williams Sonoma',
    449.95,
    '✅ Active - 2 year warranty, almost 2 years left',
    'WS-2024-98765'
  );

  -- Expires in 3 years (extended warranty)
  INSERT INTO public.warranties (user_id, product_name, brand, model, purchase_date, warranty_end_date, store_name, purchase_price, notes, warranty_type)
  VALUES (
    v_user_id,
    'LG Refrigerator',
    'LG',
    'LRFVS3006S',
    CURRENT_DATE - INTERVAL '2 months',
    CURRENT_DATE + INTERVAL '34 months',
    'Home Depot',
    2899.00,
    '✅ Active - Extended warranty, 3 years total',
    'extended'
  );

  RAISE NOTICE '';
  RAISE NOTICE '✅ ✅ ✅ SUCCESS! ✅ ✅ ✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Created 15 test warranties:';
  RAISE NOTICE '  🔴 3 Expired';
  RAISE NOTICE '  🟡 1 Expiring today';
  RAISE NOTICE '  ⚠️  3 Expiring within 7 days (URGENT)';
  RAISE NOTICE '  🟠 3 Expiring within 30 days';
  RAISE NOTICE '  ✅ 5 Active (safe for now)';
  RAISE NOTICE '';
  RAISE NOTICE 'Refresh your app to see them all!';
  RAISE NOTICE 'Dashboard should show proper counts by status.';
END $$;

