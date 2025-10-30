import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  Shield,
  Package,
  AlertCircle,
  Star,
  Calendar,
  PiggyBank,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";

export const ValueDashboard = () => {
  const { data: warranties } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate values
  const totalValue = warranties?.reduce((sum, w) => sum + (w.purchase_price || 0), 0) || 0;
  const activeWarranties =
    warranties?.filter((w) => {
      const daysLeft = differenceInDays(new Date(w.warranty_end_date), new Date());
      return daysLeft >= 0;
    }) || [];
  const activeValue = activeWarranties.reduce((sum, w) => sum + (w.purchase_price || 0), 0);

  const urgentWarranties =
    warranties?.filter((w) => {
      const daysLeft = differenceInDays(new Date(w.warranty_end_date), new Date());
      return daysLeft >= 0 && daysLeft <= 7;
    }) || [];

  // Find most valuable items
  const sortedByValue = [...(warranties || [])].sort(
    (a, b) => (b.purchase_price || 0) - (a.purchase_price || 0)
  );
  const topItems = sortedByValue.slice(0, 3);

  // Calculate monthly spending
  const currentYear = new Date().getFullYear();
  const thisYearPurchases =
    warranties?.filter((w) => new Date(w.purchase_date).getFullYear() === currentYear) || [];
  const thisYearValue = thisYearPurchases.reduce((sum, w) => sum + (w.purchase_price || 0), 0);
  const monthlyAverage = thisYearValue / (new Date().getMonth() + 1);

  // Category breakdown
  const categoryValue: { [key: string]: number } = {};
  warranties?.forEach((w) => {
    const category = w.category || "Other";
    categoryValue[category] = (categoryValue[category] || 0) + (w.purchase_price || 0);
  });

  const topCategory = Object.entries(categoryValue).sort((a, b) => b[1] - a[1])[0];

  // Estimate savings from warranties
  const estimatedSavings = activeValue * 0.15; // Estimate 15% potential claims

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Value Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Protected Value</CardDescription>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {warranties?.length || 0} products
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Active Coverage</CardDescription>
              <Shield className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">${activeValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeWarranties.length} active warranties
            </p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Est. Savings</CardDescription>
              <PiggyBank className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">${estimatedSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Potential claim value</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Monthly Average</CardDescription>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">${monthlyAverage.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{currentYear} purchases</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Valuable Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-yellow-500" />
              Most Valuable Items
            </CardTitle>
            <CardDescription>Your highest-value protected products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items yet</p>
              </div>
            ) : (
              topItems.map((item, index) => {
                const daysLeft = differenceInDays(
                  new Date(item.warranty_end_date),
                  new Date()
                );
                const isActive = daysLeft >= 0;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {item.brand && `${item.brand} `}
                          {item.product_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.purchase_date), "MMM yyyy")}
                          </p>
                          <Badge
                            variant={isActive ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {isActive ? `${daysLeft}d left` : "Expired"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${item.purchase_price?.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Quick Insights
            </CardTitle>
            <CardDescription>Smart recommendations for you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Urgent Warranties Alert */}
            {urgentWarranties.length > 0 && (
              <div className="p-3 rounded-lg border-2 border-warning/30 bg-warning/5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-warning">Urgent Action Needed!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {urgentWarranties.length} warranty
                      {urgentWarranties.length > 1 ? "ies" : "y"} expiring within 7 days (
                      ${urgentWarranties
                        .reduce((sum, w) => sum + (w.purchase_price || 0), 0)
                        .toFixed(2)}{" "}
                      value)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Coverage Status */}
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Coverage Status</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((activeValue / totalValue) * 100 || 0).toFixed(0)}% of your total value is
                    actively protected
                  </p>
                </div>
              </div>
            </div>

            {/* Top Category */}
            {topCategory && (
              <div className="p-3 rounded-lg border bg-gray-50">
                <div className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Top Category</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>{topCategory[0]}</strong>: ${topCategory[1].toFixed(2)} invested
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Spending Trend */}
            <div className="p-3 rounded-lg border bg-gray-50">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Spending Trend</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You've added {thisYearPurchases.length} items in {currentYear} (${thisYearValue.toFixed(2)} total)
                  </p>
                </div>
              </div>
            </div>

            {/* Potential Savings */}
            <div className="p-3 rounded-lg border-2 border-success/30 bg-success/5">
              <div className="flex items-start gap-2">
                <PiggyBank className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-success">Potential Savings</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your warranties could save you up to ${estimatedSavings.toFixed(2)} in repair
                    costs
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

