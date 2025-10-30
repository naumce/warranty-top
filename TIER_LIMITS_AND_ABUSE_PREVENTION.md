# 🚨 Tier Limits & Abuse Prevention Strategy

## The "Unlimited" Problem

### Nightmare Scenario:

```
Abusive Premium User ($4.99/month):
- Creates 1000 fake warranties
- Uploads 6 photos each = 6000 photos
- Each photo 2MB (uncompressed) = 12GB
- Supabase: $0.09/GB/month = $1.08/month storage
- BUT: 100 users doing this = $108/month in storage costs!
- Your revenue: 100 × $4.99 = $499
- Your costs: $108 + $25 (base) = $133
- Profit margin destroyed! 😱
```

---

## ✅ Solution: "Unlimited*" (With Fair Use Limits)

### Premium Should Be:
- ✅ High enough that 99% of users never hit it
- ✅ Low enough to prevent abuse
- ✅ Enforceable with database constraints
- ✅ Clear in terms of service

---

## 📊 Realistic User Behavior

### Average Premium User:
- **Warranties:** 10-30 (not 1000!)
- **Photos per warranty:** 3-4 (not 6!)
- **Documents:** 2-3 (not 5!)
- **Total storage:** ~20-60MB per user

### Power User:
- **Warranties:** 50-100
- **Photos:** 5-6 per warranty
- **Documents:** 4-5 per warranty
- **Total storage:** ~150-300MB per user

### Abuser (What We Want to Prevent):
- **Warranties:** 500+
- **Photos:** 6+ per warranty
- **Documents:** 10+ per warranty
- **Total storage:** 1GB+ per user

---

## 🎯 New Tier Structure (With Abuse Prevention)

| Feature | 🆓 FREE | 💎 PREMIUM | 🚨 Abuse Limit |
|---------|---------|------------|----------------|
| **Warranties** | 3 | **100** (not "unlimited") | Hard cap |
| **Photos per warranty** | 2 | **6** | Hard cap |
| **Documents per warranty** | 0 | **5** | Hard cap |
| **Total storage per user** | 10MB | **300MB** | Hard cap |
| **Uploads per hour** | - | **20 files** | Rate limit |
| **Receipt OCR** | 5/month | **30/month** | Hard cap |
| **AI barcode lookups** | 0 | **50/month** | Hard cap |

### Why These Limits Work:

✅ **100 warranties** = Covers 99% of real users (who has 100 products under warranty?)  
✅ **6 photos** = More than enough (front, back, receipt, serial, box, defect)  
✅ **5 documents** = Plenty (receipt, manual, warranty card, invoice, proof)  
✅ **300MB storage** = ~50 warranties with full photos/docs  
✅ **30 OCR scans/month** = 1 per day, more than enough  
✅ **50 AI lookups/month** = 1.6 per day, covers heavy use  

**Feels "unlimited" to users, but protects you from abuse!** 🛡️

---

## 🔒 Abuse Prevention Mechanisms

### 1. Database-Level Constraints

```sql
-- User limits table (enforced in DB)
CREATE TABLE user_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  tier TEXT NOT NULL DEFAULT 'free',
  
  -- Hard limits
  max_warranties INTEGER,
  max_photos_per_warranty INTEGER,
  max_documents_per_warranty INTEGER,
  max_storage_mb INTEGER,
  max_ocr_scans_per_month INTEGER,
  max_ai_lookups_per_month INTEGER,
  
  -- Current usage
  current_warranties INTEGER DEFAULT 0,
  current_storage_mb DECIMAL(10,2) DEFAULT 0,
  ocr_scans_used_this_month INTEGER DEFAULT 0,
  ai_lookups_used_this_month INTEGER DEFAULT 0,
  
  -- Reset tracking
  usage_resets_at TIMESTAMP WITH TIME ZONE,
  
  -- Abuse detection
  upload_count_last_hour INTEGER DEFAULT 0,
  last_upload_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger: Check limits before insert
CREATE OR REPLACE FUNCTION check_warranty_limits()
RETURNS TRIGGER AS $$
DECLARE
  user_limit RECORD;
BEGIN
  SELECT * INTO user_limit FROM user_limits WHERE user_id = NEW.user_id;
  
  -- Check warranty count
  IF user_limit.current_warranties >= user_limit.max_warranties THEN
    RAISE EXCEPTION 'Warranty limit reached (max: %)', user_limit.max_warranties;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check storage before file upload
CREATE OR REPLACE FUNCTION check_storage_limits()
RETURNS TRIGGER AS $$
DECLARE
  user_limit RECORD;
  file_size_mb DECIMAL(10,2);
BEGIN
  SELECT * INTO user_limit FROM user_limits WHERE user_id = NEW.user_id;
  file_size_mb := NEW.file_size / 1024.0 / 1024.0;
  
  -- Check storage quota
  IF (user_limit.current_storage_mb + file_size_mb) > user_limit.max_storage_mb THEN
    RAISE EXCEPTION 'Storage limit reached (max: % MB)', user_limit.max_storage_mb;
  END IF;
  
  -- Check rate limit (20 uploads per hour)
  IF user_limit.last_upload_at > NOW() - INTERVAL '1 hour' 
     AND user_limit.upload_count_last_hour >= 20 THEN
    RAISE EXCEPTION 'Upload rate limit exceeded. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Frontend Checks (User-Friendly)

```typescript
// Before upload
const canUploadPhoto = async (warrantyId: string) => {
  const { data: warranty } = await supabase
    .from('warranties')
    .select('photos_count')
    .eq('id', warrantyId)
    .single();
  
  const { data: userLimits } = await supabase
    .from('user_limits')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (warranty.photos_count >= userLimits.max_photos_per_warranty) {
    toast.error(`Photo limit reached (max: ${userLimits.max_photos_per_warranty})`);
    return false;
  }
  
  if (userLimits.current_storage_mb >= userLimits.max_storage_mb) {
    toast.error(`Storage limit reached (${userLimits.max_storage_mb}MB). Delete some files or contact support.`);
    return false;
  }
  
  return true;
};
```

### 3. Admin Monitoring Dashboard

You need visibility into:
- Top 10 users by storage
- Top 10 users by warranty count
- Users approaching limits
- Suspicious activity (e.g., 100 uploads in 1 day)

---

## 💰 Cost Analysis (With Limits)

### Worst Case Scenario (All Premium Users Max Out)

| Metric | Per User | 100 Users | 1000 Users |
|--------|----------|-----------|------------|
| **Max storage** | 300MB | 30GB | 300GB |
| **Supabase cost** | - | $27/month | $270/month |
| **Revenue** | $4.99 | $499/month | $4,990/month |
| **Profit margin** | - | **93% ($472)** | **94% ($4,720)** |

**Even if EVERY premium user maxes out storage, you're still profitable!** ✅

### Realistic Scenario (Average Use)

| Metric | Per User | 100 Users | 1000 Users |
|--------|----------|-----------|------------|
| **Avg storage** | 50MB | 5GB | 50GB |
| **Supabase cost** | - | $25/month (Pro) | $45/month (Pro + extra) |
| **Revenue** | $4.99 | $499/month | $4,990/month |
| **Profit margin** | - | **95% ($474)** | **99% ($4,945)** |

**With normal usage, your costs are minimal!** 🚀

---

## 🛡️ Additional Protection

### 1. Terms of Service

```
Fair Use Policy:

Premium tier includes:
- Up to 100 warranties
- Up to 6 photos per warranty
- Up to 5 documents per warranty
- 300MB total storage
- 30 OCR scans per month
- 50 AI lookups per month

We reserve the right to suspend accounts that:
- Exceed 500MB storage
- Upload more than 50 files per day
- Create more than 150 warranties
- Show signs of automated/bot activity

For enterprise needs (500+ warranties), 
please contact sales@warranty-tracker.com
```

### 2. Grace Warnings

Don't immediately block users, warn them first:

**User at 80% of limit:**
```
📊 You're using 240MB of 300MB storage.
   Consider deleting old photos or contact support.
```

**User at 95%:**
```
⚠️ Almost out of storage! (285MB/300MB)
   Please delete some files or we may need to pause uploads.
```

**User hits 100%:**
```
🚫 Storage limit reached (300MB)
   Delete files to continue or contact support for enterprise pricing.
```

### 3. File Compression (Already Planned)

- Compress images to 800×600, 80% quality
- 2MB → 300KB (83% savings!)
- User uploads "6 photos" but only uses ~1.8MB, not 12MB

---

## 📋 Updated Tiers (Final)

| Feature | 🆓 FREE | 💎 PREMIUM ($4.99/mo) |
|---------|---------|----------------------|
| **Warranties** | 3 | **100** |
| **Photos per warranty** | 2 | **6** |
| **Docs per warranty** | 0 | **5** |
| **Total storage** | 10MB | **300MB** |
| **Receipt OCR** | 5/month | **30/month** |
| **AI barcode** | Manual entry only | **50/month** |
| **Rate limit** | - | 20 uploads/hour |
| **Barcode scanner** | ✅ Unlimited | ✅ Unlimited |
| **Barcode DB lookup** | ✅ Instant | ✅ Instant |
| **Emergency mode** | ✅ Yes | ✅ Yes |
| **Store finder** | ✅ Yes | ✅ Yes |
| **PDF export** | ✅ Yes | ✅ Yes |
| **Smart notifications** | ✅ Yes | ✅ Yes |
| **Claim notes/photos** | ❌ No | ✅ Yes |

### Marketing Copy

> **Premium: Up to 100 warranties with 6 photos each**  
> More than enough for all your electronics, appliances, and valuables!

*(Not "unlimited" but feels unlimited!)*

---

## 🎯 Implementation Checklist

1. ✅ Use **"Up to 100 warranties"** instead of "unlimited"
2. ✅ Enforce limits at **database level** (can't bypass)
3. ✅ Add **rate limiting** (20 uploads/hour)
4. ✅ Set **storage quota** (300MB per premium user)
5. ✅ Monitor **top users** weekly (watch for abuse)
6. ✅ Add **grace warnings** at 80%, 95%, 100%
7. ✅ Reserve right to **suspend abusers** in ToS
8. ✅ Implement **image compression** (2MB → 300KB)
9. ✅ Create **admin dashboard** for monitoring
10. ✅ Add **Fair Use Policy** to Terms of Service

**This protects you while giving users more than they'll ever need!** 🛡️

---

## 🚀 Next Steps

1. Review and approve tier limits
2. Implement database schema with limits
3. Add frontend validation
4. Create Terms of Service with Fair Use Policy
5. Build admin monitoring dashboard
6. Test with various scenarios
7. Launch with confidence!

