-- Migration: Fix Function Search Path Security Warnings
-- This migration adds SET search_path to all functions to prevent schema injection attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Drop triggers first, then functions
DROP TRIGGER IF EXISTS check_warranty_limit_on_insert ON warranties CASCADE;
DROP TRIGGER IF EXISTS decrement_warranty_count_trigger ON warranties CASCADE;
DROP TRIGGER IF EXISTS update_warranty_claims_updated_at_trigger ON warranty_claims CASCADE;
DROP TRIGGER IF EXISTS add_claim_status_history_trigger ON warranty_claims CASCADE;

-- Now drop ALL function overloads (use CASCADE to handle dependencies)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 'DROP FUNCTION IF EXISTS ' || oid::regprocedure || ' CASCADE;' as drop_cmd
        FROM pg_proc 
        WHERE proname IN (
            'can_add_warranty',
            'enforce_warranty_limit',
            'decrement_warranty_count',
            'increment_ocr_usage',
            'increment_ai_lookup_usage',
            'update_user_tier',
            'increment_ai_support_usage',
            'can_use_ai_support',
            'increment_barcode_scans',
            'get_or_cache_barcode',
            'report_incorrect_barcode',
            'update_warranty_claims_updated_at',
            'add_claim_status_history'
        )
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE r.drop_cmd;
    END LOOP;
END $$;

-- 1. Fix can_add_warranty function
CREATE OR REPLACE FUNCTION public.can_add_warranty(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  RETURN usage.current_warranties < usage.max_warranties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Fix enforce_warranty_limit function
CREATE OR REPLACE FUNCTION public.enforce_warranty_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_limit INTEGER;
  current_count INTEGER;
BEGIN
  SELECT max_warranties INTO user_limit
  FROM user_usage_tracking
  WHERE user_id = NEW.user_id;
  
  SELECT COUNT(*) INTO current_count
  FROM warranties
  WHERE user_id = NEW.user_id;
  
  IF current_count >= user_limit THEN
    RAISE EXCEPTION 'Warranty limit reached. Current: %, Max: %', current_count, user_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Fix decrement_warranty_count function
CREATE OR REPLACE FUNCTION public.decrement_warranty_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_usage_tracking
  SET current_warranties = GREATEST(0, current_warranties - 1),
      updated_at = NOW()
  WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Fix increment_ocr_usage function
CREATE OR REPLACE FUNCTION public.increment_ocr_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_usage_tracking (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  END IF;

  IF NOW() > usage.usage_period_end THEN
    UPDATE user_usage_tracking 
    SET ocr_scans_used = 1,
        usage_period_start = NOW(),
        usage_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;
  
  UPDATE user_usage_tracking 
  SET ocr_scans_used = usage.ocr_scans_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. Fix increment_ai_lookup_usage function
CREATE OR REPLACE FUNCTION public.increment_ai_lookup_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_usage_tracking (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  END IF;

  IF NOW() > usage.usage_period_end THEN
    UPDATE user_usage_tracking 
    SET ai_lookups_used = 1,
        usage_period_start = NOW(),
        usage_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;
  
  UPDATE user_usage_tracking 
  SET ai_lookups_used = usage.ai_lookups_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6. Fix update_user_tier function
CREATE OR REPLACE FUNCTION public.update_user_tier(
  p_user_id UUID,
  p_tier TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_usage_tracking 
  SET tier = p_tier,
      max_warranties = CASE p_tier
        WHEN 'free' THEN 5
        WHEN 'basic' THEN 20
        WHEN 'pro' THEN 100
        WHEN 'ultimate' THEN 999999
        ELSE 5
      END,
      max_storage_mb = CASE p_tier
        WHEN 'free' THEN 50
        WHEN 'basic' THEN 100
        WHEN 'pro' THEN 500
        WHEN 'ultimate' THEN 2000
        ELSE 50
      END,
      max_photos_per_warranty = CASE p_tier
        WHEN 'free' THEN 2
        WHEN 'basic' THEN 5
        WHEN 'pro' THEN 10
        WHEN 'ultimate' THEN 20
        ELSE 2
      END,
      max_ocr_scans_per_month = CASE p_tier
        WHEN 'free' THEN 3
        WHEN 'basic' THEN 10
        WHEN 'pro' THEN 50
        WHEN 'ultimate' THEN 999999
        ELSE 3
      END,
      max_ai_lookups_per_month = CASE p_tier
        WHEN 'free' THEN 0
        WHEN 'basic' THEN 10
        WHEN 'pro' THEN 30
        WHEN 'ultimate' THEN 999999
        ELSE 0
      END,
      max_ai_support_requests_per_month = CASE p_tier
        WHEN 'free' THEN 0
        WHEN 'basic' THEN 20
        WHEN 'pro' THEN 100
        WHEN 'ultimate' THEN 999999
        ELSE 0
      END,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 7. Fix increment_ai_support_usage function
CREATE OR REPLACE FUNCTION public.increment_ai_support_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_usage_tracking (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  END IF;

  IF NOW() > usage.usage_period_end THEN
    UPDATE user_usage_tracking 
    SET ocr_scans_used = 0,
        ai_lookups_used = 0,
        ai_support_requests_used = 1,
        usage_period_start = NOW(),
        usage_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;
  
  UPDATE user_usage_tracking 
  SET ai_support_requests_used = usage.ai_support_requests_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 8. Fix can_use_ai_support function
CREATE OR REPLACE FUNCTION public.can_use_ai_support(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  IF usage.subscription_status = 'blocked' THEN
    IF usage.blocked_until IS NOT NULL AND usage.blocked_until > NOW() THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  IF usage.tier = 'ultimate' THEN
    RETURN TRUE;
  END IF;
  
  RETURN usage.ai_support_requests_used < usage.max_ai_support_requests_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 9. Fix increment_barcode_scans function
CREATE OR REPLACE FUNCTION public.increment_barcode_scans(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_usage_tracking 
  SET barcode_scans_used = barcode_scans_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 10. Fix get_or_cache_barcode function
CREATE OR REPLACE FUNCTION public.get_or_cache_barcode(
  p_barcode TEXT,
  p_product_name TEXT DEFAULT NULL,
  p_brand TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  barcode TEXT,
  product_name TEXT,
  brand TEXT,
  model TEXT,
  category TEXT,
  confidence_score NUMERIC,
  scan_count INTEGER
) AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM barcode_cache WHERE barcode_cache.barcode = p_barcode) THEN
    UPDATE barcode_cache 
    SET scan_count = scan_count + 1,
        last_scanned_at = NOW()
    WHERE barcode_cache.barcode = p_barcode;
    
    RETURN QUERY
    SELECT 
      bc.barcode,
      bc.product_name,
      bc.brand,
      bc.model,
      bc.category,
      bc.confidence_score,
      bc.scan_count
    FROM barcode_cache bc
    WHERE bc.barcode = p_barcode;
  ELSE
    INSERT INTO barcode_cache (
      barcode,
      product_name,
      brand,
      model,
      category,
      confidence_score,
      scan_count
    ) VALUES (
      p_barcode,
      p_product_name,
      p_brand,
      p_model,
      p_category,
      0.8,
      1
    );
    
    RETURN QUERY
    SELECT 
      p_barcode,
      p_product_name,
      p_brand,
      p_model,
      p_category,
      0.8::NUMERIC,
      1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 11. Fix report_incorrect_barcode function
CREATE OR REPLACE FUNCTION public.report_incorrect_barcode(
  p_barcode TEXT,
  p_reported_by UUID,
  p_correct_product_name TEXT DEFAULT NULL,
  p_correct_brand TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO barcode_corrections (
    barcode,
    reported_by,
    correct_product_name,
    correct_brand,
    notes
  ) VALUES (
    p_barcode,
    p_reported_by,
    p_correct_product_name,
    p_correct_brand,
    p_notes
  );
  
  UPDATE barcode_cache
  SET confidence_score = GREATEST(0, confidence_score - 0.1)
  WHERE barcode = p_barcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 12. Fix update_warranty_claims_updated_at function
CREATE OR REPLACE FUNCTION public.update_warranty_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 13. Fix add_claim_status_history function
CREATE OR REPLACE FUNCTION public.add_claim_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO warranty_claim_history (
      claim_id,
      status,
      notes,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.status,
      'Status changed to ' || NEW.status,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Recreate triggers that were dropped
CREATE TRIGGER check_warranty_limit_on_insert
  BEFORE INSERT ON warranties
  FOR EACH ROW
  EXECUTE FUNCTION enforce_warranty_limit();

CREATE TRIGGER decrement_warranty_count_trigger
  AFTER DELETE ON warranties
  FOR EACH ROW
  EXECUTE FUNCTION decrement_warranty_count();

CREATE TRIGGER update_warranty_claims_updated_at_trigger
  BEFORE UPDATE ON warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_claims_updated_at();

CREATE TRIGGER add_claim_status_history_trigger
  AFTER INSERT OR UPDATE ON warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION add_claim_status_history();

-- Add comment to document the security fix
COMMENT ON FUNCTION public.can_add_warranty IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.enforce_warranty_limit IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.decrement_warranty_count IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.increment_ocr_usage IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.increment_ai_lookup_usage IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.update_user_tier IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.increment_ai_support_usage IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.can_use_ai_support IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.increment_barcode_scans IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.get_or_cache_barcode IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.report_incorrect_barcode IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.update_warranty_claims_updated_at IS 'Fixed: Added SET search_path for security (2025-11-01)';
COMMENT ON FUNCTION public.add_claim_status_history IS 'Fixed: Added SET search_path for security (2025-11-01)';

