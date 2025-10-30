import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { differenceInDays, format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export const WarrantyTimeline = () => {
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

  const today = new Date();
  const next90Days = addDays(today, 90);

  // Group warranties by expiry date
  const expiringWarranties = warranties?.filter((w) => {
    const endDate = new Date(w.warranty_end_date);
    return endDate >= today && endDate <= next90Days;
  }).sort((a, b) => 
    new Date(a.warranty_end_date).getTime() - new Date(b.warranty_end_date).getTime()
  );

  // Group by week
  const weekGroups: { [key: string]: any[] } = {};
  expiringWarranties?.forEach((w) => {
    const endDate = new Date(w.warranty_end_date);
    const daysLeft = differenceInDays(endDate, today);
    
    let weekLabel = "";
    if (daysLeft === 0) {
      weekLabel = "Today";
    } else if (daysLeft === 1) {
      weekLabel = "Tomorrow";
    } else if (daysLeft <= 7) {
      weekLabel = "This Week";
    } else if (daysLeft <= 14) {
      weekLabel = "Next Week";
    } else if (daysLeft <= 30) {
      weekLabel = "This Month";
    } else if (daysLeft <= 60) {
      weekLabel = "Next Month";
    } else {
      weekLabel = "Later";
    }

    if (!weekGroups[weekLabel]) {
      weekGroups[weekLabel] = [];
    }
    weekGroups[weekLabel].push({ ...w, daysLeft });
  });

  const weekOrder = ["Today", "Tomorrow", "This Week", "Next Week", "This Month", "Next Month", "Later"];
  const sortedGroups = weekOrder.filter((week) => weekGroups[week]);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Expiry Timeline
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Upcoming expirations (90 days)</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {!expiringWarranties || expiringWarranties.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No warranties expiring in the next 90 days</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map((weekLabel) => (
              <div key={weekLabel}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-sm">{weekLabel}</h4>
                  <Badge variant="outline" className="text-xs">
                    {weekGroups[weekLabel].length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {weekGroups[weekLabel].map((w: any) => {
                    const isUrgent = w.daysLeft <= 7;
                    const isToday = w.daysLeft === 0;

                    return (
                      <div
                        key={w.id}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          isToday
                            ? "border-danger bg-danger/5"
                            : isUrgent
                            ? "border-warning bg-warning/5"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {w.brand && `${w.brand} `}
                              {w.product_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(w.warranty_end_date), "MMM dd, yyyy")}
                              </p>
                              {isUrgent && (
                                <AlertCircle className={`h-3 w-3 ${isToday ? "text-danger" : "text-warning"}`} />
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={isToday ? "destructive" : isUrgent ? "default" : "outline"}
                            className={isUrgent && !isToday ? "bg-warning text-white" : ""}
                          >
                            {w.daysLeft === 0 ? "Expires Today!" : `${w.daysLeft}d left`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

