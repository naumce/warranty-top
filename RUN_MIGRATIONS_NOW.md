# 🚀 RUN MIGRATIONS NOW - 5 Minutes

## ✅ Step-by-Step Guide

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Click on your project: **Warranty** (vxhuosduqrpbevnwvxku)
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

---

### Step 2: Run Migration #1 - Tier System

1. Open this file in your code editor:
   ```
   /supabase/migrations/20251030000000_add_tier_system.sql
   ```

2. Select ALL content (Cmd/Ctrl + A)

3. Copy it (Cmd/Ctrl + C)

4. Paste into Supabase SQL Editor

5. Click **RUN** (or press Cmd/Ctrl + Enter)

6. You should see:
   ```
   ✅ Tier system migration completed successfully!
   📊 Created user_usage_tracking table
   🔧 Added functions: can_add_warranty, increment_ocr_usage, update_user_tier
   ⚡ Added triggers: warranty limit enforcement
   🎯 Backfilled usage data for X existing users
   ```

---

### Step 3: Run Migration #2 - Barcode Database

1. Click **+ New Query** again

2. Open this file:
   ```
   /supabase/migrations/20251030000001_add_barcode_database.sql
   ```

3. Select ALL content (Cmd/Ctrl + A)

4. Copy it (Cmd/Ctrl + C)

5. Paste into Supabase SQL Editor

6. Click **RUN**

7. You should see:
   ```
   ✅ Barcode database migration completed!
   📦 Pre-populated with 50 products
   🔍 Barcode lookup will now check local DB first (FREE!)
   💰 This saves expensive AI API calls!
   ```

---

### Step 4: Verify Everything Works

Run this query in SQL Editor:

```sql
-- Check if tables exist
SELECT 
  'user_usage_tracking' as table_name,
  COUNT(*) as row_count
FROM user_usage_tracking
UNION ALL
SELECT 
  'product_barcodes' as table_name,
  COUNT(*) as row_count
FROM product_barcodes;
```

You should see:
```
user_usage_tracking | [number of users]
product_barcodes    | 50+
```

---

### Step 5: Check Your Own Usage

```sql
-- See your own tier & limits
SELECT 
  tier,
  max_warranties,
  current_warranties,
  max_storage_mb,
  current_storage_mb
FROM user_usage_tracking
WHERE user_id = auth.uid();
```

You should see:
```
tier: 'free'
max_warranties: 3
current_warranties: [your count]
max_storage_mb: 10
current_storage_mb: 0.00
```

---

### Step 6: Test in Your App

1. Start your dev server:
   ```bash
   cd warranty-bot-main
   npm run dev
   ```

2. Open: http://localhost:5173

3. Login to your app

4. Look for:
   - ✅ **Usage Widget** in the right sidebar (desktop)
   - ✅ Shows "2 / 3 warranties" (or your current count)
   - ✅ Shows storage usage

5. Try adding a 4th warranty:
   - ✅ Should show **Upgrade Prompt** instead!

---

## 🎉 Done!

If you see all these things, your tier system is working perfectly!

---

## 🐛 Troubleshooting

### Problem: "relation user_usage_tracking does not exist"

**Solution**: You didn't run Migration #1. Go back to Step 2.

---

### Problem: "function can_add_warranty does not exist"

**Solution**: Migration #1 didn't complete. Try running it again.

---

### Problem: Usage Widget doesn't show up

**Solution**:
1. Make sure you're on desktop (widget is hidden on mobile/tablet)
2. Hard refresh: Cmd/Ctrl + Shift + R
3. Check browser console for errors

---

### Problem: Can still add unlimited warranties

**Solution**:
1. Check if migration created the trigger:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname = 'check_warranty_limit_on_insert';
   ```
2. If not found, re-run Migration #1

---

## 📞 Need Help?

Check the logs:
```sql
-- See all your warranties
SELECT COUNT(*) FROM warranties WHERE user_id = auth.uid();

-- See your usage tracking
SELECT * FROM user_usage_tracking WHERE user_id = auth.uid();
```

---

## 🚀 Next Steps

Once migrations are working:

1. ✅ Test limit enforcement
2. ✅ Test image compression
3. ✅ Test barcode scanner
4. ✅ Add Terms & Privacy pages
5. ✅ Deploy to production!

---

**You're almost ready to launch!** 🎊

