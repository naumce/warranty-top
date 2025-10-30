# 🚀 Run Tier System Migration

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: **Warranty** (vxhuosduqrpbevnwvxku)
3. Click **SQL Editor** in left sidebar

## Step 2: Run Migration

1. Click **New Query**
2. Copy the ENTIRE contents of:
   ```
   /supabase/migrations/20251030000000_add_tier_system.sql
   ```
3. Paste into SQL Editor
4. Click **Run** (or press `Ctrl/Cmd + Enter`)

## Step 3: Verify Success

You should see:
```
✅ Tier system migration completed successfully!
📊 Created user_usage_tracking table
🔧 Added functions: can_add_warranty, increment_ocr_usage, update_user_tier
⚡ Added triggers: warranty limit enforcement
🎯 Backfilled usage data for X existing users
```

## Step 4: Test It

Run this query to verify:
```sql
-- Check if table exists
SELECT * FROM user_usage_tracking LIMIT 5;

-- Check your own usage
SELECT 
  tier,
  current_warranties,
  max_warranties,
  current_storage_mb,
  max_storage_mb
FROM user_usage_tracking
WHERE user_id = auth.uid();
```

You should see:
- `tier: 'free'`
- `max_warranties: 3`
- `current_warranties: [your current count]`

## ✅ Done!

Once you see the success message, we can move to **Step 2: Frontend Usage Hook**

---

**Run it now and let me know when it's done!** 🚀

