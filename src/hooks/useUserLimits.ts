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
  warning_count: number;
  blocked_until: string | null;
}

export const useUserLimits = () => {
  const queryClient = useQueryClient();

  // Fetch user limits
  const { data: limits, isLoading, error } = useQuery({
    queryKey: ["user_limits"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_usage_tracking")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch user limits:", error);
        throw error;
      }
      
      return data as UserLimits;
    },
    staleTime: 30000, // Cache for 30 seconds
    retry: 2,
  });

  // Check if user can add warranty
  const canAddWarranty = () => {
    if (!limits) return { allowed: false, reason: "Loading limits..." };
    
    // Check if blocked
    if (limits.subscription_status === 'blocked') {
      if (limits.blocked_until && new Date(limits.blocked_until) > new Date()) {
        return { 
          allowed: false, 
          reason: "Account temporarily blocked. Please contact support." 
        };
      }
    }
    
    // Check warranty limit
    if (limits.current_warranties >= limits.max_warranties) {
      return { 
        allowed: false, 
        reason: `You've reached your limit of ${limits.max_warranties} warranties. Upgrade to add more!`,
        currentTier: limits.tier 
      };
    }
    
    return { allowed: true, reason: "" };
  };

  // Check if user can use OCR
  const canUseOCR = () => {
    if (!limits) return { allowed: false, reason: "Loading limits..." };
    
    // FREE users can't use OCR
    if (limits.tier === 'free') {
      return {
        allowed: false,
        reason: "AI Receipt Scanning is a premium feature. Upgrade to unlock!",
        currentTier: 'free'
      };
    }
    
    // ULTIMATE has unlimited
    if (limits.tier === 'ultimate') {
      return { allowed: true, reason: "" };
    }
    
    // Check monthly limit
    if (limits.ocr_scans_used >= limits.max_ocr_scans_per_month) {
      return {
        allowed: false,
        reason: `You've used all ${limits.max_ocr_scans_per_month} OCR scans this month. Upgrade to PRO or wait until next month!`,
        currentTier: limits.tier
      };
    }
    
    return { allowed: true, reason: "" };
  };

  // Check if user can use AI barcode lookup
  const canUseAILookup = () => {
    if (!limits) return { allowed: false, reason: "Loading limits..." };
    
    // FREE users can't use AI lookup
    if (limits.tier === 'free') {
      return {
        allowed: false,
        reason: "AI Barcode Lookup is a premium feature. Try manual entry or upgrade!",
        currentTier: 'free'
      };
    }
    
    // ULTIMATE has unlimited
    if (limits.tier === 'ultimate') {
      return { allowed: true, reason: "" };
    }
    
    // Check monthly limit
    if (limits.ai_lookups_used >= limits.max_ai_lookups_per_month) {
      return {
        allowed: false,
        reason: `You've used all ${limits.max_ai_lookups_per_month} AI lookups this month.`,
        currentTier: limits.tier
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
      // Refresh limits after incrementing
      queryClient.invalidateQueries({ queryKey: ["user_limits"] });
    },
    onError: (error) => {
      console.error("Failed to increment OCR usage:", error);
      toast.error("Failed to track OCR usage");
    }
  });

  // Increment AI lookup usage
  const incrementAILookup = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc('increment_ai_lookup_usage', {
        p_user_id: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_limits"] });
    },
    onError: (error) => {
      console.error("Failed to increment AI lookup:", error);
    }
  });

  // Helper: Get usage percentage
  const getWarrantyUsagePercent = () => {
    if (!limits) return 0;
    return Math.round((limits.current_warranties / limits.max_warranties) * 100);
  };

  const getStorageUsagePercent = () => {
    if (!limits) return 0;
    return Math.round((limits.current_storage_mb / limits.max_storage_mb) * 100);
  };

  const getOCRUsagePercent = () => {
    if (!limits || limits.tier === 'ultimate') return 0;
    return Math.round((limits.ocr_scans_used / limits.max_ocr_scans_per_month) * 100);
  };

  // Helper: Format usage text
  const formatWarrantyUsage = () => {
    if (!limits) return "Loading...";
    return `${limits.current_warranties}/${limits.max_warranties}`;
  };

  const formatStorageUsage = () => {
    if (!limits) return "Loading...";
    return `${limits.current_storage_mb.toFixed(1)}MB / ${limits.max_storage_mb}MB`;
  };

  const formatOCRUsage = () => {
    if (!limits) return "Loading...";
    if (limits.tier === 'ultimate') return 'Unlimited';
    if (limits.tier === 'free') return 'Upgrade to unlock';
    return `${limits.ocr_scans_used}/${limits.max_ocr_scans_per_month}`;
  };

  // Helper: Get tier name for display
  const getTierDisplayName = () => {
    if (!limits) return 'FREE';
    return limits.tier.toUpperCase();
  };

  // Helper: Check if approaching limits (80%+)
  const isApproachingWarrantyLimit = () => getWarrantyUsagePercent() >= 80;
  const isApproachingStorageLimit = () => getStorageUsagePercent() >= 80;
  const isApproachingOCRLimit = () => getOCRUsagePercent() >= 80;

  return {
    // Raw data
    limits,
    isLoading,
    error,
    
    // Check functions
    canAddWarranty,
    canUseOCR,
    canUseAILookup,
    
    // Mutation functions
    incrementOCRUsage: incrementOCRUsage.mutate,
    incrementAILookup: incrementAILookup.mutate,
    
    // Formatted data
    tierName: limits?.tier || 'free',
    tierDisplayName: getTierDisplayName(),
    isBlocked: limits?.subscription_status === 'blocked',
    isFree: limits?.tier === 'free',
    isPremium: limits?.tier !== 'free',
    
    // Usage stats
    warrantyUsage: formatWarrantyUsage(),
    storageUsage: formatStorageUsage(),
    ocrUsage: formatOCRUsage(),
    
    // Usage percentages
    warrantyUsagePercent: getWarrantyUsagePercent(),
    storageUsagePercent: getStorageUsagePercent(),
    ocrUsagePercent: getOCRUsagePercent(),
    
    // Warnings
    isApproachingWarrantyLimit: isApproachingWarrantyLimit(),
    isApproachingStorageLimit: isApproachingStorageLimit(),
    isApproachingOCRLimit: isApproachingOCRLimit(),
  };
};

