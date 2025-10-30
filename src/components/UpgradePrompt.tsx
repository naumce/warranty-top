/**
 * Upgrade Prompt Component
 * Beautiful modal that appears when users hit limits
 * Shows tier comparisons and benefits
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, X, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  currentTier: string;
  triggerFeature?: 'warranty' | 'ocr' | 'storage' | 'ai_lookup';
}

export const UpgradePrompt = ({ 
  open, 
  onOpenChange, 
  reason, 
  currentTier,
  triggerFeature = 'warranty'
}: UpgradePromptProps) => {
  
  const getTierRecommendation = () => {
    if (currentTier === 'free') return 'basic';
    if (currentTier === 'basic') return 'pro';
    return 'ultimate';
  };

  const recommendedTier = getTierRecommendation();

  const tierFeatures = {
    free: {
      name: 'FREE',
      price: '$0',
      color: 'bg-gray-500',
      features: [
        '3 warranties',
        '10MB storage',
        '2 photos per warranty',
        'No documents',
        'No AI features',
        'Manual entry only',
      ],
      limitations: true,
    },
    basic: {
      name: 'BASIC',
      price: '$2.99/mo',
      color: 'bg-gradient-to-r from-green-600 to-emerald-600',
      features: [
        '20 warranties',
        '100MB storage',
        '4 photos per warranty',
        '2 documents per warranty',
        '5 AI scans/month',
        '10 AI lookups/month',
        'Email support',
      ],
      popular: currentTier === 'free',
    },
    pro: {
      name: 'PRO',
      price: '$6.99/mo',
      color: 'bg-gradient-to-r from-blue-600 to-cyan-600',
      features: [
        '100 warranties',
        '500MB storage',
        '6 photos per warranty',
        '5 documents per warranty',
        '20 AI scans/month',
        '30 AI lookups/month',
        'Priority support',
        'Advanced insights',
      ],
      popular: currentTier === 'basic',
    },
    ultimate: {
      name: 'ULTIMATE',
      price: '$14.99/mo',
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      features: [
        'Unlimited warranties',
        '2GB storage',
        '10 photos per warranty',
        'Unlimited documents',
        'Unlimited AI scans',
        'Unlimited AI lookups',
        '24/7 priority support',
        'Advanced insights',
        'API access (coming soon)',
      ],
      popular: currentTier === 'pro',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                Upgrade Your Account
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                {reason}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          {/* Show recommended tier prominently */}
          {recommendedTier && (
            <div className={`border-2 border-primary rounded-lg p-6 ${tierFeatures[recommendedTier as keyof typeof tierFeatures].color} bg-opacity-5`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge className={`${tierFeatures[recommendedTier as keyof typeof tierFeatures].color} text-white border-none mb-2`}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    RECOMMENDED FOR YOU
                  </Badge>
                  <h3 className="text-2xl font-bold">{tierFeatures[recommendedTier as keyof typeof tierFeatures].name}</h3>
                  <p className="text-3xl font-bold mt-1">{tierFeatures[recommendedTier as keyof typeof tierFeatures].price}</p>
                </div>
                <div className="text-right">
                  <Button 
                    size="lg" 
                    className={`${tierFeatures[recommendedTier as keyof typeof tierFeatures].color} hover:opacity-90`}
                    onClick={() => {
                      // TODO: Navigate to payment page
                      window.open(`/upgrade?tier=${recommendedTier}`, '_blank');
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
              
              <ul className="space-y-2">
                {tierFeatures[recommendedTier as keyof typeof tierFeatures].features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* All Tiers Comparison */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">All Plans</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(tierFeatures).map(([key, tier]) => {
                if (key === currentTier) return null; // Skip current tier
                if (key === recommendedTier) return null; // Skip recommended (shown above)
                
                return (
                  <div 
                    key={key} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{tier.name}</h4>
                      <span className="text-lg font-bold">{tier.price}</span>
                    </div>
                    <ul className="space-y-1">
                      {tier.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1 text-xs">
                          <Check className="h-3 w-3 text-success shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {tier.features.length > 4 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{tier.features.length - 4} more features
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => window.open('/pricing', '_blank')} 
              variant="outline"
              className="flex-1"
            >
              Compare All Plans
            </Button>
            <Button 
              onClick={() => onOpenChange(false)} 
              variant="ghost"
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
          
          {/* Money-back guarantee */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
            <p className="text-sm text-success font-medium">
              ✨ 30-Day Money-Back Guarantee • Cancel Anytime
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

