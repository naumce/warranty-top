import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

export const ClaimTracker = () => {
  const { data: claims, isLoading } = useQuery({
    queryKey: ["warranty_claims"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranty_claims")
        .select(
          `
          *,
          warranties (
            product_name,
            brand,
            model
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "submitted":
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "approved":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "denied":
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500";
      case "submitted":
        return "bg-blue-500";
      case "under_review":
        return "bg-yellow-500";
      case "approved":
        return "bg-success";
      case "completed":
        return "bg-green-600";
      case "denied":
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case "draft":
        return 10;
      case "submitted":
        return 30;
      case "under_review":
        return 60;
      case "approved":
        return 90;
      case "completed":
        return 100;
      case "denied":
      case "cancelled":
        return 100;
      default:
        return 0;
    }
  };

  const handleContactSupport = (claim: any) => {
    if (claim.support_phone) {
      window.open(`tel:${claim.support_phone}`);
    } else {
      toast.info("Support phone number not available");
    }
  };

  const handleEmailSupport = (claim: any) => {
    if (claim.support_email) {
      const subject = encodeURIComponent(`Claim Follow-up: ${claim.claim_number || claim.id}`);
      const body = encodeURIComponent(`
Dear Support Team,

I am following up on my warranty claim:

Claim Number: ${claim.claim_number || claim.id}
Product: ${claim.warranties?.brand || ""} ${claim.warranties?.product_name}
Status: ${getStatusLabel(claim.claim_status)}
Submitted: ${format(new Date(claim.submitted_at || claim.created_at), "MMM dd, yyyy")}

Could you please provide an update on the status of this claim?

Thank you for your assistance.
      `.trim());
      window.open(`mailto:${claim.support_email}?subject=${subject}&body=${body}`);
    } else {
      toast.info("Support email not available");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Warranty Claims
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Track your warranty claims</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 pt-0">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-base sm:text-lg font-semibold mb-2">No Claims Filed</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            File a claim when something breaks
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          Warranty Claims ({claims.length})
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Track your warranty claims</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        {claims.map((claim: any) => {
          const daysAgo = claim.submitted_at
            ? Math.abs(differenceInDays(new Date(), new Date(claim.submitted_at)))
            : Math.abs(differenceInDays(new Date(), new Date(claim.created_at)));

          return (
            <Card key={claim.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">
                      {claim.warranties?.brand && `${claim.warranties.brand} `}
                      {claim.warranties?.product_name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {claim.issue_type}
                      {claim.claim_number && ` • Claim #${claim.claim_number}`}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(claim.claim_status)} text-white`}>
                    {getStatusIcon(claim.claim_status)}
                    <span className="ml-1">{getStatusLabel(claim.claim_status)}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Claim Progress</span>
                    <span>{getProgressValue(claim.claim_status)}%</span>
                  </div>
                  <Progress value={getProgressValue(claim.claim_status)} />
                </div>

                {/* Claim Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Submitted</p>
                    <p className="font-semibold">
                      {format(
                        new Date(claim.submitted_at || claim.created_at),
                        "MMM dd, yyyy"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{daysAgo} days ago</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Desired Resolution</p>
                    <p className="font-semibold">{claim.desired_resolution || "Not specified"}</p>
                  </div>
                </div>

                {/* Issue Description */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Issue Description:</p>
                  <p className="text-sm line-clamp-2">{claim.issue_description}</p>
                </div>

                {/* Next Follow-up */}
                {claim.next_followup_date && (
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>
                      <strong>Follow-up:</strong>{" "}
                      {format(new Date(claim.next_followup_date), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  {claim.support_phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleContactSupport(claim)}
                    >
                      <Phone className="h-3 w-3 mr-2" />
                      Call
                    </Button>
                  )}
                  {claim.support_email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEmailSupport(claim)}
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      Email
                    </Button>
                  )}
                  {claim.claim_portal_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(claim.claim_portal_url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Portal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

