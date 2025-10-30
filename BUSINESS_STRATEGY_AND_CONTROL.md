# 🚀 WARRANTY TRACKER - Business Strategy & Control System

## 🎯 The Vision: Market Domination Through AI

**Core Philosophy:**
> **AI costs us money → AI costs users money → Users who need AI pay for it**

---

## 💡 The Big Insight

### What COSTS Us Money (Charge For It):
- ✅ **AI Receipt OCR** ($0.002/scan) → Charge users
- ✅ **AI Barcode Lookup** ($0.003/lookup) → Charge users  
- ✅ **Storage > 100MB** ($0.09/GB) → Charge users
- ✅ **API bandwidth** → Charge heavy users

### What's FREE for Us (Give Generously):
- ✅ **Barcode scanner** (uses device camera)
- ✅ **Database lookups** (cheap)
- ✅ **Notifications** (browser API, free)
- ✅ **PDF generation** (client-side)
- ✅ **Emergency mode** (just UI)

### The Strategy:
**Hook them with free features, charge for AI superpowers!** 🪝

---

## 🎮 Tier Structure V2: The Smart Way

| Feature | 🆓 FREE | 💎 BASIC ($2.99/mo) | 🚀 PRO ($6.99/mo) | 🔥 ULTIMATE ($14.99/mo) |
|---------|---------|---------------------|-------------------|------------------------|
| **Warranties** | 3 | 20 | 100 | Unlimited |
| **Storage** | 10MB | 100MB | 500MB | 2GB |
| **Photos/warranty** | 2 | 4 | 6 | 10 |
| **Documents** | 0 | 2 | 5 | Unlimited |
| | | | | |
| **🤖 AI FEATURES** | | | | |
| **AI Receipt OCR** | ❌ 0 | ✅ 5/month | ✅ 20/month | ✅ Unlimited |
| **AI Barcode Lookup** | ❌ Manual | ✅ 10/month | ✅ 30/month | ✅ Unlimited |
| **AI Auto-Fill** | ❌ | ❌ | ✅ | ✅ |
| **AI Warranty Prediction** | ❌ | ❌ | ❌ | ✅ |
| | | | | |
| **📦 BASIC FEATURES** | | | | |
| **Barcode Scanner** | ✅ | ✅ | ✅ | ✅ |
| **DB Lookup** | ✅ Instant | ✅ Instant | ✅ Instant | ✅ Instant |
| **Emergency Mode** | ✅ | ✅ | ✅ | ✅ |
| **Store Finder** | ✅ | ✅ | ✅ | ✅ |
| **Notifications** | ✅ Basic | ✅ Advanced | ✅ Advanced | ✅ Priority |
| **PDF Export** | ✅ | ✅ | ✅ | ✅ |
| **Claims Tracking** | ❌ | ✅ Basic | ✅ Full | ✅ + AI insights |
| | | | | |
| **💼 SUPPORT** | | | | |
| **Support** | Community | Email (48h) | Email (24h) | Priority (4h) |

---

## 💰 PAYMENT MODEL: Hybrid Approach

### Model 1: Pure Subscription (Recommended)
```
FREE → $2.99/mo → $6.99/mo → $14.99/mo

✅ Predictable revenue
✅ Simple for users
✅ Easy to implement
❌ Users might not upgrade until they need AI
```

### Model 2: Credits System (AI Pay-Per-Use)
```
FREE tier + Buy AI Credits:
- $4.99 = 50 OCR scans + 100 barcode lookups
- $9.99 = 120 OCR scans + 250 barcode lookups (20% bonus)
- $19.99 = 300 OCR scans + 600 barcode lookups (40% bonus)

✅ Users only pay for what they use
✅ Higher revenue per power user
✅ Feels fair ("I only use OCR sometimes")
❌ Complex to implement
❌ Users might feel nickel-and-dimed
```

### Model 3: HYBRID (🏆 BEST OPTION)
```
Subscription TIERS + Optional AI Credit Packs:

FREE: 0 AI features
BASIC ($2.99): 5 OCR + 10 lookups/month
PRO ($6.99): 20 OCR + 30 lookups/month
  → Need more? Buy AI Credit Pack ($4.99 for 50 extra)
  
ULTIMATE ($14.99): Unlimited AI

✅ Best of both worlds
✅ Recurring revenue + upsell opportunity
✅ Serves both casual and power users
✅ Extra monetization from power users on lower tiers
```

**Recommendation: Start with Model 1 (Pure Subscription), add Model 3 (Credits) in Month 2**

---

## 🎛️ REAL-TIME USAGE TRACKING SYSTEM

### Database Schema: `user_usage_tracking`

```sql
CREATE TABLE user_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription Info
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'ultimate'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'blocked'
  
  -- Hard Limits (from tier)
  max_warranties INTEGER NOT NULL DEFAULT 3,
  max_storage_mb INTEGER NOT NULL DEFAULT 10,
  max_photos_per_warranty INTEGER NOT NULL DEFAULT 2,
  max_documents_per_warranty INTEGER NOT NULL DEFAULT 0,
  max_ocr_scans_per_month INTEGER NOT NULL DEFAULT 0,
  max_ai_lookups_per_month INTEGER NOT NULL DEFAULT 0,
  
  -- Current Usage (REAL-TIME)
  current_warranties INTEGER DEFAULT 0,
  current_storage_mb DECIMAL(10,2) DEFAULT 0.00,
  current_photos INTEGER DEFAULT 0,
  current_documents INTEGER DEFAULT 0,
  
  -- Monthly AI Usage (RESETS)
  ocr_scans_used INTEGER DEFAULT 0,
  ai_lookups_used INTEGER DEFAULT 0,
  ai_credits_purchased INTEGER DEFAULT 0, -- For credit system
  ai_credits_remaining INTEGER DEFAULT 0,
  usage_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  
  -- Abuse Detection (CRITICAL!)
  uploads_last_hour INTEGER DEFAULT 0,
  uploads_last_day INTEGER DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  
  warning_count INTEGER DEFAULT 0,
  last_warning_at TIMESTAMP WITH TIME ZONE,
  blocked_until TIMESTAMP WITH TIME ZONE,
  block_reason TEXT,
  
  -- Revenue Tracking
  total_revenue_generated DECIMAL(10,2) DEFAULT 0.00,
  lifetime_value DECIMAL(10,2) DEFAULT 0.00,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_user_usage_user_id ON user_usage_tracking(user_id);
CREATE INDEX idx_user_usage_tier ON user_usage_tracking(tier);
CREATE INDEX idx_user_usage_blocked ON user_usage_tracking(blocked_until);
CREATE INDEX idx_user_usage_warnings ON user_usage_tracking(warning_count);

-- RLS: Users can only see their own usage
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON user_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);
```

### Real-Time Calculation Functions

```sql
-- Function: Check if user can add warranty
CREATE OR REPLACE FUNCTION can_add_warranty(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, current_count INTEGER, max_count INTEGER) AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF usage.subscription_status = 'blocked' THEN
    RETURN QUERY SELECT FALSE, 'Account blocked: ' || usage.block_reason, usage.current_warranties, usage.max_warranties;
  END IF;
  
  IF usage.current_warranties >= usage.max_warranties THEN
    RETURN QUERY SELECT FALSE, 'Warranty limit reached', usage.current_warranties, usage.max_warranties;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'OK', usage.current_warranties, usage.max_warranties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can use AI OCR
CREATE OR REPLACE FUNCTION can_use_ocr(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, scans_used INTEGER, scans_limit INTEGER) AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  -- Reset monthly counter if period expired
  IF NOW() > usage.usage_period_end THEN
    UPDATE user_usage_tracking 
    SET ocr_scans_used = 0,
        ai_lookups_used = 0,
        usage_period_start = NOW(),
        usage_period_end = NOW() + INTERVAL '1 month'
    WHERE user_id = p_user_id;
    
    usage.ocr_scans_used := 0;
  END IF;
  
  IF usage.tier = 'free' THEN
    RETURN QUERY SELECT FALSE, 'OCR is a premium feature. Upgrade to use AI scanning!', usage.ocr_scans_used, usage.max_ocr_scans_per_month;
  END IF;
  
  IF usage.tier != 'ultimate' AND usage.ocr_scans_used >= usage.max_ocr_scans_per_month THEN
    -- Check if they have purchased credits
    IF usage.ai_credits_remaining > 0 THEN
      RETURN QUERY SELECT TRUE, 'Using purchased credits', usage.ocr_scans_used, usage.max_ocr_scans_per_month;
    ELSE
      RETURN QUERY SELECT FALSE, 'Monthly OCR limit reached. Upgrade to PRO or buy AI credits!', usage.ocr_scans_used, usage.max_ocr_scans_per_month;
    END IF;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'OK', usage.ocr_scans_used, usage.max_ocr_scans_per_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Increment OCR usage
CREATE OR REPLACE FUNCTION increment_ocr_usage(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  -- If unlimited tier, don't increment
  IF usage.tier = 'ultimate' THEN
    RETURN;
  END IF;
  
  -- If using purchased credits
  IF usage.ai_credits_remaining > 0 THEN
    UPDATE user_usage_tracking 
    SET ai_credits_remaining = ai_credits_remaining - 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_usage_tracking 
    SET ocr_scans_used = ocr_scans_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🚨 AUTOMATED ABUSE DETECTION & BLOCKING

### Rule-Based Auto-Block System

```sql
CREATE TABLE abuse_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'storage', 'upload_rate', 'api_abuse', 'suspicious_pattern'
  threshold_value DECIMAL(10,2),
  threshold_unit TEXT, -- 'mb', 'count', 'per_hour', 'per_day'
  action TEXT NOT NULL, -- 'warn', 'block_1h', 'block_24h', 'block_permanent', 'notify_admin'
  tier_applies_to TEXT[], -- ['free', 'basic', 'pro', 'ultimate']
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-defined abuse rules
INSERT INTO abuse_rules (rule_name, rule_type, threshold_value, threshold_unit, action, tier_applies_to) VALUES
  ('Storage Overage 120%', 'storage', 1.2, 'multiplier', 'warn', ARRAY['free', 'basic']),
  ('Storage Overage 150%', 'storage', 1.5, 'multiplier', 'block_24h', ARRAY['free', 'basic']),
  ('Upload Rate 50/hour', 'upload_rate', 50, 'per_hour', 'block_1h', ARRAY['free', 'basic', 'pro']),
  ('Upload Rate 200/day', 'upload_rate', 200, 'per_day', 'warn', ARRAY['free', 'basic', 'pro']),
  ('Storage Hard Limit', 'storage', 500, 'mb', 'block_permanent', ARRAY['free']),
  ('AI Spam 100 OCR/hour', 'api_abuse', 100, 'per_hour', 'block_24h', ARRAY['basic', 'pro']),
  ('Warranty Spam 20/hour', 'api_abuse', 20, 'per_hour', 'block_1h', ARRAY['free']),
  ('Suspicious: 0 photos', 'suspicious_pattern', 10, 'count', 'notify_admin', ARRAY['free', 'basic', 'pro', 'ultimate']);

-- Function: Check abuse rules and take action
CREATE OR REPLACE FUNCTION check_abuse_rules(p_user_id UUID)
RETURNS TABLE(rule_triggered TEXT, action_taken TEXT) AS $$
DECLARE
  usage RECORD;
  rule RECORD;
  storage_ratio DECIMAL(10,2);
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  -- Check storage overage
  storage_ratio := usage.current_storage_mb / NULLIF(usage.max_storage_mb, 0);
  
  FOR rule IN 
    SELECT * FROM abuse_rules 
    WHERE enabled = TRUE 
      AND usage.tier = ANY(tier_applies_to)
      AND rule_type = 'storage'
  LOOP
    IF storage_ratio >= rule.threshold_value THEN
      -- Execute action
      CASE rule.action
        WHEN 'warn' THEN
          UPDATE user_usage_tracking 
          SET warning_count = warning_count + 1,
              last_warning_at = NOW()
          WHERE user_id = p_user_id;
          
          RETURN QUERY SELECT rule.rule_name::TEXT, 'WARNING_SENT'::TEXT;
          
        WHEN 'block_1h' THEN
          UPDATE user_usage_tracking 
          SET subscription_status = 'blocked',
              blocked_until = NOW() + INTERVAL '1 hour',
              block_reason = rule.rule_name
          WHERE user_id = p_user_id;
          
          RETURN QUERY SELECT rule.rule_name::TEXT, 'BLOCKED_1H'::TEXT;
          
        WHEN 'block_24h' THEN
          UPDATE user_usage_tracking 
          SET subscription_status = 'blocked',
              blocked_until = NOW() + INTERVAL '24 hours',
              block_reason = rule.rule_name
          WHERE user_id = p_user_id;
          
          RETURN QUERY SELECT rule.rule_name::TEXT, 'BLOCKED_24H'::TEXT;
          
        WHEN 'block_permanent' THEN
          UPDATE user_usage_tracking 
          SET subscription_status = 'blocked',
              blocked_until = NOW() + INTERVAL '100 years',
              block_reason = rule.rule_name || ' - Contact support'
          WHERE user_id = p_user_id;
          
          RETURN QUERY SELECT rule.rule_name::TEXT, 'BLOCKED_PERMANENT'::TEXT;
      END CASE;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-check abuse rules on storage update
CREATE OR REPLACE FUNCTION trigger_abuse_check()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_abuse_rules(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_abuse_on_update
  AFTER UPDATE OF current_storage_mb, uploads_last_hour, uploads_last_day
  ON user_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION trigger_abuse_check();
```

---

## 📊 ADMIN MONITORING DASHBOARD

### What YOU Need to See (Real-Time)

#### Dashboard View 1: Health Metrics
```
┌─────────────────────────────────────────────────┐
│ 🎯 Revenue & User Stats                        │
├─────────────────────────────────────────────────┤
│ MRR:              $2,847                        │
│ Total Users:      847                           │
│ FREE:             720 (85%)                     │
│ BASIC:            82  (10%)                     │
│ PRO:              38  (4%)                      │
│ ULTIMATE:         7   (1%)                      │
│                                                 │
│ Conversion Rate:  15% (FREE → PAID)            │
│ Churn Rate:       2.3%                          │
│ LTV:              $67                           │
└─────────────────────────────────────────────────┘
```

#### Dashboard View 2: Resource Usage
```
┌─────────────────────────────────────────────────┐
│ 💾 Storage & Costs                              │
├─────────────────────────────────────────────────┤
│ Total Storage:    42 GB / 100 GB (42%)         │
│ Supabase Cost:    $25/month (Pro plan)         │
│                                                 │
│ AI API Costs:                                   │
│ - OCR Scans:      1,247 ($2.49)                │
│ - Barcode Lookups: 3,821 ($11.46)              │
│ - Total AI Cost:  $13.95                       │
│                                                 │
│ NET PROFIT:       $2,808 💰                     │
└─────────────────────────────────────────────────┘
```

#### Dashboard View 3: 🚨 Abuse Alerts
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Users Needing Attention                     │
├─────────────────────────────────────────────────┤
│ 🔴 user@example.com                             │
│    - Storage: 487MB / 100MB (487%)             │
│    - Action: AUTO-BLOCKED (24h)                │
│    - Last activity: 2 hours ago                │
│                                                 │
│ 🟡 power@user.com                               │
│    - Storage: 92MB / 100MB (92%)               │
│    - Action: WARNING SENT                      │
│    - Uploads: 45 in last hour                  │
│                                                 │
│ 🟢 All other users: Normal usage               │
└─────────────────────────────────────────────────┘
```

#### Dashboard View 4: Top Users
```
┌─────────────────────────────────────────────────┐
│ 🏆 Top 10 Users by Storage                     │
├─────────────────────────────────────────────────┤
│ 1. john@example.com     478MB (PRO)            │
│ 2. sarah@test.com       412MB (PRO)            │
│ 3. mike@company.com     387MB (ULTIMATE)       │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

### SQL Queries for Dashboard

```sql
-- Query 1: Revenue & User Stats
SELECT 
  COUNT(*) FILTER (WHERE tier = 'free') as free_users,
  COUNT(*) FILTER (WHERE tier = 'basic') as basic_users,
  COUNT(*) FILTER (WHERE tier = 'pro') as pro_users,
  COUNT(*) FILTER (WHERE tier = 'ultimate') as ultimate_users,
  SUM(CASE 
    WHEN tier = 'basic' THEN 2.99
    WHEN tier = 'pro' THEN 6.99
    WHEN tier = 'ultimate' THEN 14.99
    ELSE 0
  END) as mrr
FROM user_usage_tracking
WHERE subscription_status = 'active';

-- Query 2: Top Storage Users
SELECT 
  u.email,
  ut.tier,
  ut.current_storage_mb,
  ut.max_storage_mb,
  ROUND((ut.current_storage_mb / NULLIF(ut.max_storage_mb, 0) * 100), 2) as usage_percent
FROM user_usage_tracking ut
JOIN auth.users u ON u.id = ut.user_id
ORDER BY ut.current_storage_mb DESC
LIMIT 10;

-- Query 3: Abuse Alerts
SELECT 
  u.email,
  ut.tier,
  ut.current_storage_mb,
  ut.max_storage_mb,
  ut.subscription_status,
  ut.block_reason,
  ut.blocked_until,
  ut.warning_count
FROM user_usage_tracking ut
JOIN auth.users u ON u.id = ut.user_id
WHERE 
  ut.subscription_status = 'blocked' 
  OR ut.warning_count > 0
  OR (ut.current_storage_mb / NULLIF(ut.max_storage_mb, 0)) > 0.8
ORDER BY ut.current_storage_mb DESC;

-- Query 4: AI Usage & Costs
SELECT 
  tier,
  SUM(ocr_scans_used) as total_ocr_scans,
  SUM(ai_lookups_used) as total_ai_lookups,
  SUM(ocr_scans_used) * 0.002 as ocr_cost,
  SUM(ai_lookups_used) * 0.003 as lookup_cost
FROM user_usage_tracking
WHERE usage_period_start >= DATE_TRUNC('month', NOW())
GROUP BY tier;
```

---

## 🎨 USER-FACING UI COMPONENTS

### 1. Usage Dashboard Widget (Always Visible)

```tsx
// In dashboard header/sidebar
<UsageWidget>
  <ProgressBar>
    <Label>Warranties: 12/100</Label>
    <Bar value={12} max={100} color="green" />
  </ProgressBar>
  
  <ProgressBar>
    <Label>Storage: 47MB/500MB</Label>
    <Bar value={47} max={500} color="blue" />
  </ProgressBar>
  
  {tier !== 'ultimate' && (
    <ProgressBar>
      <Label>AI Scans: 8/20 this month</Label>
      <Bar value={8} max={20} color="purple" />
      <Link>Buy more</Link>
    </ProgressBar>
  )}
</UsageWidget>
```

### 2. Warning Modals (Auto-Trigger)

**At 80% of ANY limit:**
```
⚠️ Approaching Limit

You've used 16/20 warranties.
Upgrade to PRO for 100 warranties!

[View Plans] [Dismiss]
```

**At 90%:**
```
🚨 Almost Full!

Storage: 450MB/500MB used
Consider deleting old photos or upgrade.

[Manage Files] [Upgrade]
```

**At 100%:**
```
🛑 Limit Reached

You can't add more warranties until you:
- Delete some warranties, or
- Upgrade to a higher tier

[Delete Oldest] [Upgrade Now]
```

### 3. AI Usage Prompt (When OCR clicked)

**FREE user:**
```
🤖 AI Receipt Scanning

This feature uses advanced AI to extract data.
Upgrade to unlock 5 scans/month!

[Upgrade to BASIC - $2.99/mo] [Enter Manually]
```

**BASIC user (5/5 used):**
```
📸 Monthly AI Scans Used

You've used all 5 free scans this month!

Options:
1. Wait until Nov 1st (resets monthly)
2. Buy AI Credit Pack ($4.99 for 50 scans)
3. Upgrade to PRO (20 scans/month)

[Buy Credits] [Upgrade] [Wait]
```

---

## 🚀 MARKET DOMINATION FEATURES

### AI Features That Cost Us → Charge Users

| Feature | Our Cost | User Value | Charge | Margin |
|---------|----------|------------|--------|--------|
| **AI Receipt OCR** | $0.002/scan | High | $0.05-0.10/scan or included in tier | 💰💰💰 |
| **AI Barcode Lookup** | $0.003/lookup | Medium | $0.03-0.05/lookup or included | 💰💰 |
| **AI Warranty Predictor** | $0.01/prediction | Very High | ULTIMATE only ($14.99/mo) | 💰💰💰💰 |
| **AI Claim Assistant** | $0.02/claim | Very High | PRO+ ($6.99/mo) | 💰💰💰 |
| **AI Smart Insights** | $0.005/analysis | High | Included PRO+ | 💰💰 |

### Free Features That Hook Users

| Feature | Our Cost | User Value | Strategy |
|---------|----------|------------|----------|
| **Barcode Scanner** | $0 | High | Give FREE - hooks users! |
| **DB Lookup** | $0.0001 | High | Give FREE - community grows DB |
| **Emergency Mode** | $0 | Very High | Give FREE - goes viral! |
| **Notifications** | $0 | High | Give FREE - keeps them engaged |
| **PDF Export** | $0 | Medium | Give FREE - professionalism |
| **Store Finder** | $0 | Medium | Give FREE - solves real problem |

---

## 📈 REVENUE PROJECTIONS

### Scenario: 1000 Users After 6 Months

| Tier | Users | % | Monthly Price | MRR |
|------|-------|---|---------------|-----|
| FREE | 700 | 70% | $0 | $0 |
| BASIC | 200 | 20% | $2.99 | $598 |
| PRO | 80 | 8% | $6.99 | $559 |
| ULTIMATE | 20 | 2% | $14.99 | $300 |
| **TOTAL** | **1000** | **100%** | - | **$1,457** |

### Costs:
- Supabase Pro: $25
- OpenAI API: ~$50 (200 BASIC + 80 PRO users, moderate usage)
- Domain: $1
- **Total Costs: $76**

### **NET PROFIT: $1,381/month** 🚀💰

### With AI Credit Purchases (+20% revenue):
- **MRR: $1,748**
- **NET PROFIT: $1,672/month** 💎

---

## 🎯 IMPLEMENTATION ROADMAP

### Week 1: Foundation
- [ ] Create `user_usage_tracking` table
- [ ] Create `abuse_rules` table
- [ ] Implement limit check functions
- [ ] Add usage increment triggers
- [ ] Build frontend usage widget

### Week 2: Tier System
- [ ] Create pricing page
- [ ] Add upgrade prompts
- [ ] Implement tier checks (warranty, photo, doc limits)
- [ ] Add "soft blocks" (warnings, not hard stops)
- [ ] Test all tier transitions

### Week 3: AI Feature Gating
- [ ] Gate OCR behind tier checks
- [ ] Gate AI barcode behind tier checks
- [ ] Add usage counters (OCR/AI per month)
- [ ] Implement monthly reset logic
- [ ] Build "Buy AI Credits" flow

### Week 4: Abuse Protection
- [ ] Implement abuse detection rules
- [ ] Add auto-block triggers
- [ ] Build admin dashboard (basic)
- [ ] Add email alerts for abuse
- [ ] Test abuse scenarios

### Week 5: Payments (LemonSqueezy)
- [ ] Set up LemonSqueezy account
- [ ] Create products (BASIC, PRO, ULTIMATE)
- [ ] Implement checkout flow
- [ ] Handle webhooks (subscription updates)
- [ ] Test payment flow end-to-end

### Week 6: Polish & Launch
- [ ] Add usage analytics
- [ ] Build admin monitoring dashboard
- [ ] Create Terms of Service
- [ ] Add Fair Use Policy
- [ ] Soft launch to 50 beta users

---

## ❓ STRATEGIC QUESTIONS FOR YOU

1. **Pricing**: Start with 3 tiers or 4 tiers?
   - 3 tiers: FREE, PRO ($6.99), ULTIMATE ($14.99)
   - 4 tiers: FREE, BASIC ($2.99), PRO ($6.99), ULTIMATE ($14.99)

2. **Payment Model**: Pure subscription or Hybrid (subscription + credits)?

3. **Trial**: 7-day free trial for PRO tier? (No credit card)

4. **AI Credits**: Should BASIC/PRO users be able to buy extra AI credits? Or force upgrade?

5. **Abuse**: Auto-block after how many warnings? (1, 2, or 3?)

6. **Free Tier**: 3 or 5 warranties? (3 = more aggressive conversion, 5 = better UX)

7. **OCR Limit**: 5 free scans for testing, or completely lock behind paywall?

---

## 🔥 THE KILLER COMBO

**What makes us DOMINATE the market:**

1. ✅ **Best FREE tier** (barcode scanner, emergency mode, store finder)
2. ✅ **Generous BASIC tier** ($2.99 = perfect entry point)
3. ✅ **AI superpowers** (PRO/ULTIMATE = worth the price)
4. ✅ **Abuse protection** (automated, no manual work)
5. ✅ **Fair pricing** (users only pay for what they use)
6. ✅ **Community database** (grows automatically, reduces costs)
7. ✅ **Emergency mode** (goes viral, drives word-of-mouth)

**Users think: "This is the best warranty app AND it's fair!"** 🎯

---

## 💡 NEXT STEPS

Answer the 7 strategic questions above, then I'll:
1. Implement the tier system
2. Build the usage tracking
3. Add abuse protection
4. Create the payment flow

**Ready to dominate the market?** 🚀💰🔥

