/**
 * Usage Widget Component
 * Displays user's current tier and usage limits
 * Shows progress bars and upgrade prompts
 */

import { useUserLimits } from "@/hooks/useUserLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, AlertTriangle, Check } from "lucide-react";
import { useState } from "react";

export const UsageWidget = () => {
  const {
    limits,
    isLoading,
    tierName,
    tierDisplayName,
    isFree,
    warrantyUsage,
    storageUsage,
    ocrUsage,
    warrantyUsagePercent,
    storageUsagePercent,
    ocrUsagePercent,
    isApproachingWarrantyLimit,
    isApproachingStorageLimit,
    isApproachingOCRLimit,
  } = useUserLimits();

  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading || !limits) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </CardContent>
      </Card>
    );
  }

  const getTierColor = () => {
    switch (tierName) {
      case 'ultimate': return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'pro': return 'bg-gradient-to-r from-blue-600 to-cyan-600';
      case 'basic': return 'bg-gradient-to-r from-green-600 to-emerald-600';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };

  const getTierIcon = () => {
    if (tierName === 'ultimate' || tierName === 'pro') {
      return <Crown className="h-3 w-3" />;
    }
    return null;
  };

  return (
    <Card className="w-full border-t-4 border-t-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Your Usage</CardTitle>
          <Badge 
            className={`${getTierColor()} text-white border-none`}
            variant="default"
          >
            {getTierIcon()}
            <span className="ml-1">{tierDisplayName}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warranties */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Warranties</span>
            <span className="font-medium">{warrantyUsage}</span>
          </div>
          <Progress 
            value={warrantyUsagePercent} 
            className={`h-2 ${warrantyUsagePercent >= 90 ? 'bg-red-100' : warrantyUsagePercent >= 70 ? 'bg-yellow-100' : ''}`}
          />
          {isApproachingWarrantyLimit && (
            <div className="flex items-center gap-1 mt-1 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              <span>Almost full! Consider upgrading.</span>
            </div>
          )}
        </div>
        
        {/* Storage */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Storage</span>
            <span className="font-medium">{storageUsage}</span>
          </div>
          <Progress 
            value={storageUsagePercent} 
            className={`h-2 ${storageUsagePercent >= 90 ? 'bg-red-100' : storageUsagePercent >= 70 ? 'bg-yellow-100' : ''}`}
          />
          {isApproachingStorageLimit && (
            <div className="flex items-center gap-1 mt-1 text-xs text-warning">
              <AlertTriangle className="h-3 w-3" />
              <span>Running low on storage.</span>
            </div>
          )}
        </div>
        
        {/* OCR (if not free) */}
        {!isFree && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">AI Scans</span>
              <span className="font-medium">{ocrUsage}</span>
            </div>
            {tierName !== 'ultimate' ? (
              <>
                <Progress 
                  value={ocrUsagePercent} 
                  className={`h-2 ${ocrUsagePercent >= 90 ? 'bg-red-100' : ocrUsagePercent >= 70 ? 'bg-yellow-100' : ''}`}
                />
                {isApproachingOCRLimit && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Running out of AI scans.</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-xs text-success">
                <Check className="h-3 w-3" />
                <span>Unlimited scans</span>
              </div>
            )}
          </div>
        )}
        
        {/* Tier Features Summary */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            {isFree && (
              <>
                <div className="flex items-center justify-between">
                  <span>Photos per warranty:</span>
                  <span className="font-medium">{limits.max_photos_per_warranty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Documents:</span>
                  <span className="font-medium text-warning">Upgrade to unlock</span>
                </div>
              </>
            )}
            {!isFree && (
              <>
                <div className="flex items-center justify-between">
                  <span>Photos per warranty:</span>
                  <span className="font-medium text-success">{limits.max_photos_per_warranty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Documents per warranty:</span>
                  <span className="font-medium text-success">{limits.max_documents_per_warranty}</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Upgrade CTA */}
        {isFree && (isApproachingWarrantyLimit || warrantyUsagePercent > 50) && (
          <Button 
            size="sm" 
            className="w-full mt-2 bg-gradient-primary hover:opacity-90" 
            onClick={() => setShowUpgrade(true)}
          >
            <Crown className="h-3 w-3 mr-2" />
            Upgrade to Premium
          </Button>
        )}
        
        {tierName === 'basic' && (isApproachingOCRLimit || isApproachingWarrantyLimit) && (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full mt-2" 
            onClick={() => setShowUpgrade(true)}
          >
            <TrendingUp className="h-3 w-3 mr-2" />
            Upgrade to PRO
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

