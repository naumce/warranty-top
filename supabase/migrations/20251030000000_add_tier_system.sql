-- ============================================
-- TIER SYSTEM & USAGE TRACKING
-- Migration: Add user limits and tier management
-- Created: 2025-10-30
-- ============================================

-- Create user_usage_tracking table
CREATE TABLE IF NOT EXISTS user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Tier info
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'ultimate'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'trial', 'cancelled', 'blocked'
  
  -- Hard limits (set by tier)
  max_warranties INTEGER NOT NULL DEFAULT 3,
  max_storage_mb INTEGER NOT NULL DEFAULT 10,
  max_photos_per_warranty INTEGER NOT NULL DEFAULT 2,
  max_documents_per_warranty INTEGER NOT NULL DEFAULT 0,
  max_ocr_scans_per_month INTEGER NOT NULL DEFAULT 0,
  max_ai_lookups_per_month INTEGER NOT NULL DEFAULT 0,
  
  -- Current usage (real-time)
  current_warranties INTEGER DEFAULT 0,
  current_storage_mb DECIMAL(10,2) DEFAULT 0.00,
  
  -- Monthly usage (resets)
  ocr_scans_used INTEGER DEFAULT 0,
  ai_lookups_used INTEGER DEFAULT 0,
  usage_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  
  -- Abuse detection
  uploads_last_hour INTEGER DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  warning_count INTEGER DEFAULT 0,
  blocked_until TIMESTAMP WITH TIME ZONE,
  block_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_tier ON user_usage_tracking(tier);
CREATE INDEX IF NOT EXISTS idx_user_usage_blocked ON user_usage_tracking(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own usage
CREATE POLICY "Users can view own usage"
  ON user_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Create usage tracking on user signup
-- ============================================
CREATE OR REPLACE FUNCTION create_user_usage_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_usage_tracking (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_usage_tracking();

-- ============================================
-- FUNCTION: Check if user can add warranty
-- ============================================
CREATE OR REPLACE FUNCTION can_add_warranty(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, current_count INTEGER, max_count INTEGER) AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Create usage tracking if doesn't exist (safety net)
    INSERT INTO user_usage_tracking (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  END IF;
  
  -- Check if account is blocked
  IF usage.subscription_status = 'blocked' AND 
     (usage.blocked_until IS NULL OR usage.blocked_until > NOW()) THEN
    RETURN QUERY SELECT 
      FALSE, 
      COALESCE(usage.block_reason, 'Account temporarily blocked. Contact support.'), 
      usage.current_warranties, 
      usage.max_warranties;
    RETURN;
  END IF;
  
  -- Check warranty limit
  IF usage.current_warranties >= usage.max_warranties THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Warranty limit reached. Upgrade to add more!', 
      usage.current_warranties, 
      usage.max_warranties;
    RETURN;
  END IF;
  
  -- All good!
  RETURN QUERY SELECT TRUE, 'OK'::TEXT, usage.current_warranties, usage.max_warranties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Enforce warranty limit on insert
-- ============================================
CREATE OR REPLACE FUNCTION enforce_warranty_limit()
RETURNS TRIGGER AS $$
DECLARE
  can_add RECORD;
BEGIN
  SELECT * INTO can_add FROM can_add_warranty(NEW.user_id);
  
  IF NOT can_add.allowed THEN
    RAISE EXCEPTION USING 
      MESSAGE = can_add.reason,
      HINT = 'Current: ' || can_add.current_count || ' / Max: ' || can_add.max_count;
  END IF;
  
  -- Increment count
  UPDATE user_usage_tracking 
  SET current_warranties = current_warranties + 1,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_warranty_limit_on_insert ON warranties;
CREATE TRIGGER check_warranty_limit_on_insert
  BEFORE INSERT ON warranties
  FOR EACH ROW EXECUTE FUNCTION enforce_warranty_limit();

-- ============================================
-- TRIGGER: Decrement count on delete
-- ============================================
CREATE OR REPLACE FUNCTION decrement_warranty_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_usage_tracking 
  SET current_warranties = GREATEST(0, current_warranties - 1),
      updated_at = NOW()
  WHERE user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS decrement_warranty_on_delete ON warranties;
CREATE TRIGGER decrement_warranty_on_delete
  AFTER DELETE ON warranties
  FOR EACH ROW EXECUTE FUNCTION decrement_warranty_count();

-- ============================================
-- FUNCTION: Increment OCR usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_ocr_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  -- Reset monthly counters if period expired
  IF NOW() > usage.usage_period_end THEN
    UPDATE user_usage_tracking 
    SET ocr_scans_used = 1,
        ai_lookups_used = 0,
        usage_period_start = NOW(),
        usage_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;
  
  -- Increment OCR usage
  UPDATE user_usage_tracking 
  SET ocr_scans_used = ocr_scans_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Increment AI lookup usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_ai_lookup_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  -- Reset monthly counters if period expired
  IF NOW() > usage.usage_period_end THEN
    UPDATE user_usage_tracking 
    SET ocr_scans_used = 0,
        ai_lookups_used = 1,
        usage_period_start = NOW(),
        usage_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;
  
  -- Increment AI lookup usage
  UPDATE user_usage_tracking 
  SET ai_lookups_used = ai_lookups_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update tier (for admin/payment webhook)
-- ============================================
CREATE OR REPLACE FUNCTION update_user_tier(
  p_user_id UUID,
  p_tier TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update tier and set appropriate limits
  UPDATE user_usage_tracking 
  SET tier = p_tier,
      max_warranties = CASE p_tier
        WHEN 'free' THEN 3
        WHEN 'basic' THEN 20
        WHEN 'pro' THEN 100
        WHEN 'ultimate' THEN 999999
        ELSE 3
      END,
      max_storage_mb = CASE p_tier
        WHEN 'free' THEN 10
        WHEN 'basic' THEN 100
        WHEN 'pro' THEN 500
        WHEN 'ultimate' THEN 2000
        ELSE 10
      END,
      max_photos_per_warranty = CASE p_tier
        WHEN 'free' THEN 2
        WHEN 'basic' THEN 4
        WHEN 'pro' THEN 6
        WHEN 'ultimate' THEN 10
        ELSE 2
      END,
      max_documents_per_warranty = CASE p_tier
        WHEN 'free' THEN 0
        WHEN 'basic' THEN 2
        WHEN 'pro' THEN 5
        WHEN 'ultimate' THEN 999
        ELSE 0
      END,
      max_ocr_scans_per_month = CASE p_tier
        WHEN 'free' THEN 0
        WHEN 'basic' THEN 5
        WHEN 'pro' THEN 20
        WHEN 'ultimate' THEN 999999
        ELSE 0
      END,
      max_ai_lookups_per_month = CASE p_tier
        WHEN 'free' THEN 0
        WHEN 'basic' THEN 10
        WHEN 'pro' THEN 30
        WHEN 'ultimate' THEN 999999
        ELSE 0
      END,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BACKFILL: Create usage tracking for existing users
-- ============================================
INSERT INTO user_usage_tracking (user_id, current_warranties)
SELECT 
  u.id,
  COALESCE((SELECT COUNT(*) FROM warranties w WHERE w.user_id = u.id), 0)
FROM auth.users u
ON CONFLICT (user_id) DO UPDATE
SET current_warranties = EXCLUDED.current_warranties;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tier system migration completed successfully!';
  RAISE NOTICE '📊 Created user_usage_tracking table';
  RAISE NOTICE '🔧 Added functions: can_add_warranty, increment_ocr_usage, update_user_tier';
  RAISE NOTICE '⚡ Added triggers: warranty limit enforcement';
  RAISE NOTICE '🎯 Backfilled usage data for % existing users', (SELECT COUNT(*) FROM user_usage_tracking);
END $$;

