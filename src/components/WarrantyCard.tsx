import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, DollarSign, MapPin, Trash2, Edit, AlertCircle, Download, Phone, AlertTriangle, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { generateWarrantyPDF } from "@/lib/pdf-generator";
import { ClaimWizard } from "@/components/ClaimWizard";
import { EditWarrantyDialog } from "@/components/EditWarrantyDialog";

interface WarrantyCardProps {
  warranty: {
    id: string;
    product_name: string;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    purchase_date: string;
    warranty_end_date: string;
    store_name: string | null;
    store_address?: string | null;
    store_city?: string | null;
    store_phone?: string | null;
    receipt_number?: string | null;
    purchase_price: number | null;
    notes: string | null;
    category?: string | null;
  };
}

export const WarrantyCard = ({ warranty }: WarrantyCardProps) => {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [claimWizardOpen, setClaimWizardOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const getWarrantyStatus = () => {
    const today = new Date();
    const endDate = new Date(warranty.warranty_end_date);
    const daysUntilExpiry = differenceInDays(endDate, today);

    if (daysUntilExpiry < 0) {
      return { status: "expired", label: "Expired", color: "danger", isUrgent: false };
    } else if (daysUntilExpiry === 0) {
      return { status: "expiring-today", label: "Expires TODAY!", color: "danger", isUrgent: true };
    } else if (daysUntilExpiry <= 7) {
      return { status: "urgent", label: `${daysUntilExpiry} days left`, color: "warning", isUrgent: true };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", label: `${daysUntilExpiry} days left`, color: "warning", isUrgent: false };
    } else {
      return { status: "active", label: "Active", color: "success", isUrgent: false };
    }
  };

  const { status, label, color, isUrgent } = getWarrantyStatus();

  const handleDownloadPDF = () => {
    try {
      generateWarrantyPDF({
        ...warranty,
        brand: warranty.brand || undefined,
        model: warranty.model || undefined,
        serial_number: warranty.serial_number || undefined,
        store_name: warranty.store_name || undefined,
        store_address: warranty.store_address || undefined,
        store_city: warranty.store_city || undefined,
        store_phone: warranty.store_phone || undefined,
        receipt_number: warranty.receipt_number || undefined,
        purchase_price: warranty.purchase_price || undefined,
        notes: warranty.notes || undefined,
        category: warranty.category || undefined,
      });
      toast.success("📄 PDF downloaded!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("warranties")
      .delete()
      .eq("id", warranty.id);

    if (error) {
      toast.error("Failed to delete warranty");
      console.error(error);
    } else {
      toast.success("Warranty deleted");
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
    }
    setDeleting(false);
  };

  return (
    <Card 
      id={`warranty-${warranty.id}`}
      className={`border-${color}/20 hover:shadow-lg transition-all duration-200 ${isUrgent ? 'ring-2 ring-warning/50 shadow-warning/20' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg sm:text-xl truncate">{warranty.product_name}</CardTitle>
              {isUrgent && (
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-warning shrink-0" />
              )}
            </div>
            {(warranty.brand || warranty.model) && (
              <CardDescription className="text-sm truncate">
                {warranty.brand} {warranty.model}
              </CardDescription>
            )}
          </div>
          <Badge
            variant={status === "expired" || status === "expiring-today" ? "destructive" : "default"}
            className={`shrink-0 ${status === "active" ? "bg-success" : (status === "expiring" || status === "urgent") ? "bg-warning" : ""}`}
          >
            {label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            Purchased: {format(new Date(warranty.purchase_date), "MMM dd, yyyy")}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>
            Expires: {format(new Date(warranty.warranty_end_date), "MMM dd, yyyy")}
          </span>
        </div>
        {warranty.store_name && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{warranty.store_name}</span>
          </div>
        )}
        {warranty.purchase_price && (
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            <span>${warranty.purchase_price.toFixed(2)}</span>
          </div>
        )}
        {warranty.serial_number && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Serial:</span> {warranty.serial_number}
          </div>
        )}
        {warranty.notes && (
          <p className="text-sm text-muted-foreground pt-2 border-t">
            {warranty.notes}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-3">
        {/* Emergency Quick Actions for Urgent Warranties */}
        {isUrgent && (
          <div className="w-full space-y-2 pb-2 border-b">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1 bg-danger hover:bg-danger/90 justify-center"
                onClick={() => setClaimWizardOpen(true)}
              >
                <FileText className="h-4 w-4 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">File Claim</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 justify-center"
                onClick={() => window.open(`tel:${warranty.store_phone || '1-800-000-0000'}`)}
              >
                <Phone className="h-4 w-4 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">Call</span>
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-center"
              onClick={handleDownloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Download PDF</span>
            </Button>
          </div>
        )}
        
        {/* Regular Actions */}
        <div className="w-full flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 justify-center" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 justify-center">
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the warranty for "{warranty.product_name}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>

      {/* Claim Wizard Modal */}
      <ClaimWizard
        open={claimWizardOpen}
        onOpenChange={setClaimWizardOpen}
        warranty={warranty}
      />

      {/* Edit Warranty Dialog */}
      <EditWarrantyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        warranty={warranty}
      />
    </Card>
  );
};
