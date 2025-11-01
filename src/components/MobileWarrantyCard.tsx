import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, MapPin, DollarSign, ChevronRight, Edit, Trash2, Download, Navigation, Phone, Sparkles, Eye } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { generateWarrantyPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";
import { useUserLocation } from "@/hooks/useUserLocation";
import { findNearestStores, formatDistance } from "@/lib/location-utils";
import { EditWarrantyDialog } from "./EditWarrantyDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MobileWarrantyCardProps {
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
  index: number;
}

export const MobileWarrantyCard = ({ warranty, index }: MobileWarrantyCardProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [swipeHint, setSwipeHint] = useState(true);
  const [storesDialogOpen, setStoresDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { location, requestLocation, hasLocation, loading: locationLoading } = useUserLocation();

  // Stagger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);

    // Hide swipe hint after 3 seconds
    const hintTimer = setTimeout(() => {
      setSwipeHint(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hintTimer);
    };
  }, [index]);

  const getWarrantyStatus = () => {
    const today = new Date();
    const endDate = new Date(warranty.warranty_end_date);
    const daysUntilExpiry = differenceInDays(endDate, today);

    if (daysUntilExpiry < 0) {
      return { status: "expired", label: "Expired", color: "danger", isUrgent: false, gradient: "from-red-500/10 to-red-600/5" };
    } else if (daysUntilExpiry === 0) {
      return { status: "expiring-today", label: "TODAY!", color: "danger", isUrgent: true, gradient: "from-red-500/20 to-orange-500/10" };
    } else if (daysUntilExpiry <= 7) {
      return { status: "urgent", label: `${daysUntilExpiry}d left`, color: "warning", isUrgent: true, gradient: "from-orange-500/20 to-yellow-500/10" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", label: `${daysUntilExpiry}d left`, color: "warning", isUrgent: false, gradient: "from-yellow-500/10 to-yellow-600/5" };
    } else {
      return { status: "active", label: "Active", color: "success", isUrgent: false, gradient: "from-green-500/10 to-emerald-500/5" };
    }
  };

  const { status, label, isUrgent, gradient } = getWarrantyStatus();

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

  const handleFindStores = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasLocation) {
      requestLocation();
    }
    setStoresDialogOpen(true);
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
    setDeleteDialogOpen(false);
  };

  const nearestStores = location && warranty.store_name 
    ? findNearestStores(warranty.store_name, location.latitude, location.longitude)
    : [];

  return (
    <div
      ref={cardRef}
      className={cn(
        "transform transition-all duration-500 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer border-l-4 transition-all duration-300 active:scale-[0.98]",
          isUrgent ? "border-l-warning shadow-lg shadow-warning/20" : "border-l-primary/30",
          isExpanded ? "shadow-xl" : "shadow-md hover:shadow-lg",
          `bg-gradient-to-br ${gradient}`
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Swipe Hint Indicator */}
        {swipeHint && !isExpanded && (
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 animate-pulse">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/80 px-2 py-1 rounded-full shadow-sm">
              <span>Tap</span>
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Urgent Pulse Effect */}
        {isUrgent && !isExpanded && (
          <div className="absolute inset-0 animate-pulse-slow bg-warning/5 pointer-events-none" />
        )}

        <CardContent className="p-4">
          {/* Collapsed View */}
          <div className="space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isUrgent && (
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 animate-bounce-subtle" />
                  )}
                  <h3 className="font-semibold text-base truncate">
                    {warranty.product_name}
                  </h3>
                </div>
                {(warranty.brand || warranty.model) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {warranty.brand} {warranty.model}
                  </p>
                )}
              </div>
              <Badge
                variant={status === "expired" || status === "expiring-today" ? "destructive" : "default"}
                className={cn(
                  "shrink-0 text-xs font-bold",
                  status === "active" && "bg-success",
                  (status === "expiring" || status === "urgent") && "bg-warning"
                )}
              >
                {label}
              </Badge>
            </div>

            {/* Quick Info - Always Visible */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(warranty.warranty_end_date), "MMM dd, yyyy")}</span>
              </div>
              {warranty.purchase_price && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${warranty.purchase_price.toFixed(0)}</span>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isExpanded ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              )}
            >
              <div className="space-y-3 pt-3 border-t">
                {/* Detailed Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Purchased: </span>
                      {format(new Date(warranty.purchase_date), "MMM dd, yyyy")}
                    </div>
                  </div>

                  {warranty.store_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{warranty.store_name}</span>
                    </div>
                  )}

                  {warranty.serial_number && (
                    <div className="text-xs bg-muted/50 p-2 rounded">
                      <span className="font-medium">Serial:</span> {warranty.serial_number}
                    </div>
                  )}

                  {warranty.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded italic">
                      {warranty.notes}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {/* Preview & AI Support - Side by Side */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 min-h-[44px] text-xs bg-gradient-primary font-semibold active:scale-95 transition-transform duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/warranty/${warranty.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Preview</span>
                      <span className="xs:hidden">View</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-h-[44px] text-xs active:scale-95 transition-transform duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/support/${warranty.id}`);
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">AI Support</span>
                      <span className="xs:hidden">AI</span>
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-h-[44px] text-xs active:scale-95 transition-transform duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 min-h-[44px] text-xs active:scale-95 transition-transform duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-[44px] px-2 active:scale-95 transition-transform duration-150"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  {/* Find Stores Button - only if warranty has store */}
                  {warranty.store_name && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs"
                      onClick={handleFindStores}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Find Nearest {warranty.store_name} Stores
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Expansion Indicator */}
        <div
          className={cn(
            "absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-300",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
        </div>
      </Card>

      {/* Nearest Stores Dialog */}
      <Dialog open={storesDialogOpen} onOpenChange={setStoresDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Nearest {warranty.store_name} Stores
            </DialogTitle>
            <DialogDescription>
              {!hasLocation && !locationLoading && "Allow location access to find stores near you"}
              {locationLoading && "Getting your location..."}
              {hasLocation && nearestStores.length === 0 && `No ${warranty.store_name} stores found in our database`}
              {hasLocation && nearestStores.length > 0 && "Here are the closest stores to your location"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            {!hasLocation && !locationLoading && (
              <Button onClick={requestLocation} className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            )}

            {locationLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {hasLocation && nearestStores.map((store, idx) => (
              <Card key={idx} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{store.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {store.address}, {store.city}
                      </p>
                      <p className="text-xs font-medium text-primary mt-1">
                        📍 {formatDistance(store.distance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {store.phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => window.open(`tel:${store.phone}`, "_self")}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 h-8 text-xs"
                      onClick={() => window.open(store.googleMapsUrl, "_blank")}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Warranty Dialog */}
      <EditWarrantyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        warranty={warranty}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warranty?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the warranty for <strong>{warranty.product_name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

