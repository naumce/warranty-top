import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, FileText, Bell, Download } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "warranty_added" | "claim_filed" | "notification" | "export";
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export const RecentActivity = () => {
  const { data: warranties } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: claims } = useQuery({
    queryKey: ["recent_claims"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranty_claims")
        .select(`
          *,
          warranties (
            product_name,
            brand
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
  });

  // Build activity timeline
  const activities: Activity[] = [];

  // Add warranties
  warranties?.forEach((w) => {
    activities.push({
      id: `warranty_${w.id}`,
      type: "warranty_added",
      title: "Warranty Added",
      description: `${w.brand || ""} ${w.product_name}`,
      timestamp: w.created_at,
      icon: Plus,
      color: "text-success",
    });
  });

  // Add claims
  claims?.forEach((c: any) => {
    activities.push({
      id: `claim_${c.id}`,
      type: "claim_filed",
      title: "Claim Filed",
      description: `${c.warranties?.brand || ""} ${c.warranties?.product_name || ""}`,
      timestamp: c.created_at,
      icon: FileText,
      color: "text-blue-500",
    });
  });

  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Take only the most recent 8
  const recentActivities = activities.slice(0, 8);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your latest actions</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recentActivities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm">{activity.title}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

