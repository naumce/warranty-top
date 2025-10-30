import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, AlertTriangle, Target, Zap } from "lucide-react";
import { differenceInDays, differenceInMonths } from "date-fns";
import { useState } from "react";

interface Insight {
  id: string;
  type: "warning" | "tip" | "success" | "info";
  icon: any;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SmartInsights = () => {
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  const { data: warranties } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const generateInsights = (): Insight[] => {
    if (!warranties || warranties.length === 0) return [];

    const insights: Insight[] = [];
    const today = new Date();

    // 1. Urgent expiration warnings
    const urgentWarranties = warranties.filter((w) => {
      const daysLeft = differenceInDays(new Date(w.warranty_end_date), today);
      return daysLeft >= 0 && daysLeft <= 7;
    });

    if (urgentWarranties.length > 0) {
      const totalValue = urgentWarranties.reduce((sum, w) => sum + (w.purchase_price || 0), 0);
      insights.push({
        id: "urgent_expiration",
        type: "warning",
        icon: AlertTriangle,
        title: `${urgentWarranties.length} Warranties Expiring This Week!`,
        description: `Don't lose coverage on $${totalValue.toFixed(2)} worth of products. Review them now before it's too late.`,
        action: {
          label: "Review Now",
          onClick: () => {
            const element = document.getElementById("urgent-warranties");
            element?.scrollIntoView({ behavior: "smooth" });
          },
        },
      });
    }

    // 2. Unorganized warranties
    const missingData = warranties.filter(
      (w) => !w.serial_number || !w.receipt_number || !w.store_name
    );

    if (missingData.length >= 3) {
      insights.push({
        id: "missing_data",
        type: "tip",
        icon: Target,
        title: "Complete Your Warranty Records",
        description: `${missingData.length} warranties are missing key information like serial numbers or receipt details. Adding this info makes claims easier.`,
      });
    }

    // 3. High-value items without claims
    const highValueItems = warranties.filter((w) => (w.purchase_price || 0) > 500);
    if (highValueItems.length > 0) {
      const totalValue = highValueItems.reduce((sum, w) => sum + (w.purchase_price || 0), 0);
      insights.push({
        id: "high_value_protection",
        type: "success",
        icon: TrendingUp,
        title: "Strong Protection Portfolio",
        description: `You're protecting $${totalValue.toFixed(2)} in high-value items. Keep documentation safe and consider extended warranties.`,
      });
    }

    // 4. Spending patterns
    const recentPurchases = warranties.filter((w) => {
      const monthsAgo = differenceInMonths(today, new Date(w.purchase_date));
      return monthsAgo <= 3;
    });

    if (recentPurchases.length >= 3) {
      const totalSpent = recentPurchases.reduce((sum, w) => sum + (w.purchase_price || 0), 0);
      const avgPrice = totalSpent / recentPurchases.length;
      
      insights.push({
        id: "recent_spending",
        type: "info",
        icon: TrendingUp,
        title: "Recent Purchase Trend",
        description: `You've added ${recentPurchases.length} items in the last 3 months (avg $${avgPrice.toFixed(2)}). All warranties are being tracked!`,
      });
    }

    // 5. Expired warranties with value
    const expiredWithValue = warranties.filter((w) => {
      const daysLeft = differenceInDays(new Date(w.warranty_end_date), today);
      return daysLeft < 0 && (w.purchase_price || 0) > 100;
    });

    if (expiredWithValue.length > 0 && expiredWithValue.length <= 3) {
      insights.push({
        id: "expired_coverage",
        type: "tip",
        icon: Lightbulb,
        title: "Consider Extended Protection",
        description: `${expiredWithValue.length} valuable items no longer have warranty coverage. You might want to explore extended warranty or insurance options.`,
      });
    }

    // 6. Well-organized user
    const wellDocumented = warranties.filter(
      (w) => w.serial_number && w.receipt_number && w.store_name && w.notes
    );

    if (wellDocumented.length > 5 && wellDocumented.length / warranties.length > 0.7) {
      insights.push({
        id: "well_organized",
        type: "success",
        icon: Zap,
        title: "Excellent Record Keeping! 🎉",
        description: `${Math.round((wellDocumented.length / warranties.length) * 100)}% of your warranties have complete documentation. You're prepared for any claims!`,
      });
    }

    // 7. Category insights
    const categories: { [key: string]: number } = {};
    warranties.forEach((w) => {
      const cat = w.category || "Other";
      categories[cat] = (categories[cat] || 0) + (w.purchase_price || 0);
    });

    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > 1000) {
      insights.push({
        id: "category_concentration",
        type: "info",
        icon: Target,
        title: `Heavy Investment in ${topCategory[0]}`,
        description: `You have $${topCategory[1].toFixed(2)} invested in ${topCategory[0]}. Make sure all items are properly insured.`,
      });
    }

    // 8. No recent activity
    const recentlyAdded = warranties.filter((w) => {
      const daysAgo = differenceInDays(today, new Date(w.created_at || w.purchase_date));
      return daysAgo <= 30;
    });

    if (warranties.length > 5 && recentlyAdded.length === 0) {
      insights.push({
        id: "no_recent_activity",
        type: "tip",
        icon: Lightbulb,
        title: "Keep Your Records Updated",
        description: "No new warranties added recently. Remember to add any new purchases to maintain complete coverage tracking!",
      });
    }

    return insights.filter((i) => !dismissedInsights.includes(i.id));
  };

  const insights = generateInsights();
  const visibleInsights = insights.slice(0, 3); // Show max 3 insights

  const getIconColor = (type: string) => {
    switch (type) {
      case "warning":
        return "text-warning";
      case "success":
        return "text-success";
      case "info":
        return "text-blue-500";
      case "tip":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "destructive";
      case "success":
        return "default";
      default:
        return "outline";
    }
  };

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Lightbulb className="h-5 w-5 text-primary" />
          Smart Insights
        </CardTitle>
        <CardDescription className="text-sm">AI-powered recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {visibleInsights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className="p-4 rounded-lg border-2 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-gray-100 ${getIconColor(insight.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                  {insight.action && (
                    <Button size="sm" variant="outline" onClick={insight.action.onClick}>
                      {insight.action.label}
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissedInsights([...dismissedInsights, insight.id])}
                  className="shrink-0"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          );
        })}

        {insights.length > 3 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{insights.length - 3} more insights available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

