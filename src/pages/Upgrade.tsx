import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Crown, Zap, Shield, Sparkles } from "lucide-react";
import { useUserLimits } from "@/hooks/useUserLimits";
import { toast } from "sonner";

const Upgrade = () => {
  const navigate = useNavigate();
  const { limits, tierDisplayName } = useUserLimits();

  const tiers = [
    {
      id: 'free',
      name: 'FREE',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      color: 'from-gray-600 to-gray-700',
      icon: Shield,
      features: [
        '3 warranties',
        '10MB storage',
        '2 photos per warranty',
        'No documents',
        'No AI features',
        'Manual entry only',
      ],
      limitations: [
        'Limited warranties',
        'No OCR scanning',
        'No AI lookups',
      ],
    },
    {
      id: 'basic',
      name: 'BASIC',
      price: '$2.99',
      period: 'per month',
      description: 'Great for personal use',
      color: 'from-green-600 to-emerald-600',
      icon: Zap,
      popular: limits?.tier === 'free',
      features: [
        '20 warranties',
        '100MB storage',
        '4 photos per warranty',
        '2 documents per warranty',
        '5 AI scans/month',
        '10 AI lookups/month',
        'Email support',
      ],
      highlights: [
        'OCR receipt scanning',
        'AI barcode lookup',
        'Document storage',
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '$6.99',
      period: 'per month',
      description: 'Best for power users',
      color: 'from-blue-600 to-cyan-600',
      icon: Crown,
      popular: limits?.tier === 'basic' || limits?.tier === 'free',
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
      highlights: [
        'Multi-item receipt picker',
        'Smart warranty tracking',
        'Export data',
      ],
    },
    {
      id: 'ultimate',
      name: 'ULTIMATE',
      price: '$14.99',
      period: 'per month',
      description: 'For collectors & businesses',
      color: 'from-purple-600 to-pink-600',
      icon: Sparkles,
      popular: limits?.tier === 'pro',
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
      highlights: [
        'Everything unlimited',
        'White-glove support',
        'Early access to features',
      ],
    },
  ];

  const handleUpgrade = (tierId: string) => {
    // TODO: Integrate with payment provider (Stripe/Paddle)
    toast.info("Payment integration coming soon!", {
      description: `Selected ${tierId.toUpperCase()} plan`,
    });
  };

  const currentTier = limits?.tier || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Upgrade Your Plan
              </h1>
            </div>
          </div>
          <Badge className="bg-gradient-primary text-white">
            Current: {tierDisplayName}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Choose the Perfect Plan for You
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful features to manage all your warranties with ease. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = currentTier === tier.id;
            
            return (
              <Card
                key={tier.id}
                className={`relative ${
                  tier.popular
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : isCurrent
                    ? 'ring-2 ring-green-500'
                    : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="text-sm">{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground text-sm">/{tier.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <div className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  {tier.highlights && (
                    <>
                      <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">HIGHLIGHTS</p>
                        {tier.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm mb-2">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="font-medium">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Limitations */}
                  {tier.limitations && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">LIMITATIONS</p>
                      {tier.limitations.map((limitation, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          • {limitation}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    className={`w-full mt-4 ${
                      tier.popular || isCurrent
                        ? 'bg-gradient-primary'
                        : ''
                    }`}
                    variant={tier.popular || isCurrent ? 'default' : 'outline'}
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${tier.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my data if I downgrade?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is never deleted. If you exceed limits after downgrading, you'll be prompted to upgrade or remove some items.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact support for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upgrade;

