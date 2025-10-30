# 🚀 PRE-LAUNCH DEVELOPMENT ROADMAP

## Current Status: 70% Complete

### ✅ What's Already Built:
- [x] User authentication (Supabase)
- [x] Warranty CRUD operations
- [x] Barcode scanner (camera-based)
- [x] Mobile-responsive UI
- [x] Emergency mode
- [x] Store finder (location-based)
- [x] PDF export
- [x] Notifications system
- [x] Edit/delete warranties
- [x] Smart timeline view
- [x] Dashboard with stats

### ❌ What's MISSING (Critical for Launch):
- [ ] Tier system & usage limits
- [ ] Image compression
- [ ] Community barcode database
- [ ] Payment integration
- [ ] Abuse prevention
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Production database migration

---

## 🎯 PHASE 1: CORE INFRASTRUCTURE (Week 1-2)

### Priority: 🔴 CRITICAL - Must have before ANY users

### 1.1 Database Schema: Tier & Usage Tracking

**File:** `/supabase/migrations/20251030_add_tier_system.sql`

```sql
-- User limits and tier management
CREATE TABLE user_usage_tracking (
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_usage_user_id ON user_usage_tracking(user_id);
CREATE INDEX idx_user_usage_tier ON user_usage_tracking(tier);

-- RLS Policies
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON user_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger: Create usage tracking on user signup
CREATE OR REPLACE FUNCTION create_user_usage_tracking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_usage_tracking (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_usage_tracking();

-- Function: Check if user can add warranty
CREATE OR REPLACE FUNCTION can_add_warranty(p_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, current_count INTEGER, max_count INTEGER) AS $$
DECLARE
  usage RECORD;
BEGIN
  SELECT * INTO usage FROM user_usage_tracking WHERE user_id = p_user_id;
  
  IF usage.subscription_status = 'blocked' THEN
    RETURN QUERY SELECT FALSE, 'Account temporarily blocked. Contact support.', usage.current_warranties, usage.max_warranties;
  END IF;
  
  IF usage.current_warranties >= usage.max_warranties THEN
    RETURN QUERY SELECT FALSE, 'Warranty limit reached. Upgrade to add more!', usage.current_warranties, usage.max_warranties;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'OK', usage.current_warranties, usage.max_warranties;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Enforce warranty limit on insert
CREATE OR REPLACE FUNCTION enforce_warranty_limit()
RETURNS TRIGGER AS $$
DECLARE
  can_add RECORD;
BEGIN
  SELECT * INTO can_add FROM can_add_warranty(NEW.user_id);
  
  IF NOT can_add.allowed THEN
    RAISE EXCEPTION '%', can_add.reason;
  END IF;
  
  -- Increment count
  UPDATE user_usage_tracking 
  SET current_warranties = current_warranties + 1,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_warranty_limit_on_insert
  BEFORE INSERT ON warranties
  FOR EACH ROW EXECUTE FUNCTION enforce_warranty_limit();

-- Trigger: Decrement count on delete
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

CREATE TRIGGER decrement_warranty_on_delete
  AFTER DELETE ON warranties
  FOR EACH ROW EXECUTE FUNCTION decrement_warranty_count();
```

**Estimated Time:** 4 hours

---

### 1.2 Frontend: Usage Tracking Hook

**File:** `/src/hooks/useUserLimits.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserLimits {
  tier: 'free' | 'basic' | 'pro' | 'ultimate';
  subscription_status: 'active' | 'trial' | 'cancelled' | 'blocked';
  max_warranties: number;
  max_storage_mb: number;
  max_photos_per_warranty: number;
  max_documents_per_warranty: number;
  max_ocr_scans_per_month: number;
  max_ai_lookups_per_month: number;
  current_warranties: number;
  current_storage_mb: number;
  ocr_scans_used: number;
  ai_lookups_used: number;
}

export const useUserLimits = () => {
  const queryClient = useQueryClient();

  // Fetch user limits
  const { data: limits, isLoading } = useQuery({
    queryKey: ["user_limits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_usage_tracking")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as UserLimits;
    },
  });

  // Check if user can add warranty
  const canAddWarranty = () => {
    if (!limits) return { allowed: false, reason: "Loading..." };
    
    if (limits.subscription_status === 'blocked') {
      return { 
        allowed: false, 
        reason: "Account blocked. Please contact support." 
      };
    }
    
    if (limits.current_warranties >= limits.max_warranties) {
      return { 
        allowed: false, 
        reason: `You've reached your limit of ${limits.max_warranties} warranties. Upgrade to add more!` 
      };
    }
    
    return { allowed: true, reason: "" };
  };

  // Check if user can use OCR
  const canUseOCR = () => {
    if (!limits) return { allowed: false, reason: "Loading..." };
    
    if (limits.tier === 'free') {
      return {
        allowed: false,
        reason: "AI Receipt Scanning is a premium feature. Upgrade to unlock!"
      };
    }
    
    if (limits.tier !== 'ultimate' && limits.ocr_scans_used >= limits.max_ocr_scans_per_month) {
      return {
        allowed: false,
        reason: `You've used all ${limits.max_ocr_scans_per_month} OCR scans this month. Upgrade to PRO or wait until next month!`
      };
    }
    
    return { allowed: true, reason: "" };
  };

  // Increment OCR usage
  const incrementOCRUsage = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc('increment_ocr_usage', {
        p_user_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_limits"] });
    }
  });

  return {
    limits,
    isLoading,
    canAddWarranty,
    canUseOCR,
    incrementOCRUsage: incrementOCRUsage.mutate,
    tierName: limits?.tier || 'free',
    isBlocked: limits?.subscription_status === 'blocked',
    warrantiesUsed: `${limits?.current_warranties || 0}/${limits?.max_warranties || 3}`,
    ocrUsed: limits?.tier === 'ultimate' 
      ? 'Unlimited' 
      : `${limits?.ocr_scans_used || 0}/${limits?.max_ocr_scans_per_month || 0}`,
  };
};
```

**Estimated Time:** 3 hours

---

### 1.3 Community Barcode Database

**File:** `/supabase/migrations/20251030_add_barcode_database.sql`

```sql
CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT UNIQUE NOT NULL,
  
  -- Product info
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT,
  typical_warranty_months INTEGER DEFAULT 12,
  average_price DECIMAL(10,2),
  
  -- Cache metadata
  times_scanned INTEGER DEFAULT 1,
  last_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confidence_score DECIMAL(3,2) DEFAULT 1.0,
  data_source TEXT DEFAULT 'ai', -- 'ai', 'user', 'verified'
  
  -- Quality control
  verified BOOLEAN DEFAULT FALSE,
  reported_incorrect INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_barcodes_barcode ON product_barcodes(barcode);
CREATE INDEX idx_product_barcodes_scans ON product_barcodes(times_scanned DESC);

-- RLS
ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read barcodes"
  ON product_barcodes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert barcodes"
  ON product_barcodes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Function: Increment scan count
CREATE OR REPLACE FUNCTION increment_barcode_scans(p_barcode TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_barcodes
  SET times_scanned = times_scanned + 1,
      last_scanned_at = NOW()
  WHERE barcode = p_barcode;
END;
$$ LANGUAGE plpgsql;

-- Pre-populate with popular products
INSERT INTO product_barcodes (barcode, product_name, brand, model, category, typical_warranty_months, average_price, verified) VALUES
  ('194252193372', 'iPhone 15 Pro', 'Apple', 'A3101', 'Electronics', 12, 999.00, true),
  ('194253002581', 'iPhone 15', 'Apple', 'A3092', 'Electronics', 12, 799.00, true),
  ('194252193365', 'iPhone 15 Pro Max', 'Apple', 'A3102', 'Electronics', 12, 1199.00, true),
  ('711719541769', 'PlayStation 5', 'Sony', 'CFI-1215A', 'Gaming', 12, 499.99, true),
  ('889842916478', 'Xbox Series X', 'Microsoft', 'RRT-00001', 'Gaming', 12, 499.99, true),
  ('195949111884', 'MacBook Pro 14"', 'Apple', 'M3 Pro', 'Computers', 12, 1999.00, true),
  ('887276763293', 'AirPods Pro', 'Apple', 'MQD83AM/A', 'Audio', 12, 249.00, true),
  ('194253781417', 'Apple Watch Series 9', 'Apple', 'GPS 45mm', 'Wearables', 12, 429.00, true),
  ('8806094978933', 'Samsung Galaxy S24 Ultra', 'Samsung', 'SM-S928', 'Electronics', 12, 1199.99, true),
  ('8806095052755', 'Samsung 65" QLED TV', 'Samsung', 'QN65Q80C', 'Appliances', 12, 1499.99, true)
ON CONFLICT (barcode) DO NOTHING;
```

**Estimated Time:** 2 hours

---

### 1.4 Image Compression

**File:** `/src/lib/image-compression.ts`

```typescript
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 1200px width)
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          0.85 // 85% quality
        );
      };
      
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Usage in upload:**
```typescript
// Before upload
const compressedFile = await compressImage(originalFile);
// Upload compressedFile instead
```

**Estimated Time:** 2 hours

---

## 🎯 PHASE 2: USER EXPERIENCE (Week 2-3)

### Priority: 🟡 IMPORTANT - Improves conversion

### 2.1 Usage Dashboard Widget

**File:** `/src/components/UsageWidget.tsx`

```typescript
import { useUserLimits } from "@/hooks/useUserLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export const UsageWidget = () => {
  const { limits, warrantiesUsed, ocrUsed, tierName } = useUserLimits();
  
  if (!limits) return null;
  
  const warrantyPercent = (limits.current_warranties / limits.max_warranties) * 100;
  const storagePercent = (limits.current_storage_mb / limits.max_storage_mb) * 100;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Your Usage</CardTitle>
          <Badge variant={tierName === 'free' ? 'secondary' : 'default'}>
            {tierName.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Warranties */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Warranties</span>
            <span className="font-medium">{warrantiesUsed}</span>
          </div>
          <Progress value={warrantyPercent} className="h-2" />
        </div>
        
        {/* Storage */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Storage</span>
            <span className="font-medium">
              {limits.current_storage_mb.toFixed(1)}MB / {limits.max_storage_mb}MB
            </span>
          </div>
          <Progress value={storagePercent} className="h-2" />
        </div>
        
        {/* OCR (if not free) */}
        {tierName !== 'free' && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>AI Scans</span>
              <span className="font-medium">{ocrUsed}</span>
            </div>
            {tierName !== 'ultimate' && (
              <Progress 
                value={(limits.ocr_scans_used / limits.max_ocr_scans_per_month) * 100} 
                className="h-2" 
              />
            )}
          </div>
        )}
        
        {/* Upgrade CTA */}
        {tierName === 'free' && warrantyPercent > 60 && (
          <Button size="sm" className="w-full mt-2" variant="default">
            <Crown className="h-3 w-3 mr-2" />
            Upgrade to Add More
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

**Estimated Time:** 3 hours

---

### 2.2 Upgrade Modals

**File:** `/src/components/UpgradePrompt.tsx`

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  currentTier: string;
}

export const UpgradePrompt = ({ open, onOpenChange, reason, currentTier }: UpgradePromptProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade Needed
          </DialogTitle>
          <DialogDescription>
            {reason}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Show next tier benefits */}
          {currentTier === 'free' && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm">BASIC - $2.99/month</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span>20 warranties</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span>5 AI scans/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span>100MB storage</span>
                </li>
              </ul>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={() => window.open('/pricing', '_blank')} className="flex-1">
              View Plans
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Estimated Time:** 2 hours

---

## 🎯 PHASE 3: LEGAL & COMPLIANCE (Week 3)

### Priority: 🔴 CRITICAL - Legal requirement

### 3.1 Terms of Service

**File:** `/src/pages/Terms.tsx`

```tsx
// Standard terms of service page
// Use: https://www.termsofservicegenerator.net/
// Key points:
// - Fair use policy
// - Refund policy
// - Account suspension rules
// - Data retention
```

**Estimated Time:** 1 hour (use generator)

### 3.2 Privacy Policy

**File:** `/src/pages/Privacy.tsx`

```tsx
// GDPR-compliant privacy policy
// Use: https://www.privacypolicygenerator.info/
// Key points:
// - What data we collect
// - How we use it
// - Third-party services (Supabase, OpenAI)
// - User rights
```

**Estimated Time:** 1 hour (use generator)

---

## 🎯 PHASE 4: DEPLOYMENT & MONITORING (Week 4)

### Priority: 🔴 CRITICAL - Production readiness

### 4.1 Environment Setup

**File:** `.env.production`

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-key

# Optional
VITE_PERPLEXITY_API_KEY=your-perplexity-key
```

**Estimated Time:** 30 minutes

### 4.2 Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd warranty-bot-main
vercel --prod

# Add environment variables in Vercel dashboard
# Configure Supabase redirect URLs
```

**Estimated Time:** 1 hour

### 4.3 Error Tracking (Optional but Recommended)

```bash
# Add Sentry
npm install @sentry/react

# Configure in main.tsx
```

**Estimated Time:** 1 hour

---

## 📊 COMPLETE TIMELINE

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| **Phase 1: Core** | Tier system, limits, barcode DB, compression | 11 hours | ⏳ Not Started |
| **Phase 2: UX** | Usage widgets, upgrade prompts, modals | 5 hours | ⏳ Not Started |
| **Phase 3: Legal** | Terms, Privacy, docs | 2 hours | ⏳ Not Started |
| **Phase 4: Deploy** | Environment, Vercel, monitoring | 2.5 hours | ⏳ Not Started |
| **TOTAL** | - | **20.5 hours** | **~3 days of work** |

---

## 🎯 MINIMUM VIABLE LAUNCH (If Rushed)

If you need to launch ASAP, do ONLY these:

### Day 1 (8 hours):
1. ✅ Tier system database migration (4h)
2. ✅ Usage tracking hook (3h)
3. ✅ Image compression (1h)

### Day 2 (6 hours):
4. ✅ Barcode database (2h)
5. ✅ Usage widget (2h)
6. ✅ Upgrade prompts (2h)

### Day 3 (4 hours):
7. ✅ Terms & Privacy (2h)
8. ✅ Deploy to Vercel (1h)
9. ✅ Test everything (1h)

**LAUNCH ON DAY 4!** 🚀

---

## 🚨 LAUNCH BLOCKERS (Must Fix Before Production)

1. ❌ **No tier system** = Users can add unlimited warranties = Bankruptcy!
2. ❌ **No image compression** = Storage costs explode
3. ❌ **No terms/privacy** = Legal liability
4. ❌ **No abuse prevention** = Someone will exploit you

---

## ✅ POST-LAUNCH (Can Do Later)

These are nice-to-haves but NOT blockers:

- [ ] Referral system (Week 5)
- [ ] PDF branding (Week 5)
- [ ] Payment integration (Week 6)
- [ ] Admin dashboard (Week 6)
- [ ] AI assistant (Month 2)

---

## 🎯 WHAT TO DO RIGHT NOW

**Step 1:** Run database migrations
```bash
# Create migration file
# Copy the SQL from Phase 1.1 above
# Run it in Supabase SQL Editor
```

**Step 2:** Implement usage tracking hook
```bash
# Create /src/hooks/useUserLimits.ts
# Add to Dashboard.tsx
```

**Step 3:** Add image compression
```bash
# Create /src/lib/image-compression.ts
# Use in file upload components
```

**Step 4:** Deploy!
```bash
vercel --prod
```

---

## 💡 NEXT QUESTION FOR YOU:

**Do you want to:**
- **Option A**: Build ALL of this properly (3 days)
- **Option B**: Launch MVP quickly (skip some features, add later)
- **Option C**: I start building Phase 1 right now?

**I recommend Option A** - 3 days of work to launch with confidence! 💪

