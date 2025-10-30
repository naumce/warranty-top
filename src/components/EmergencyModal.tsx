import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, Mail, ExternalLink, Download, AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, format } from "date-fns";
import { generateWarrantyPDF } from "@/lib/pdf-generator";
import { toast } from "sonner";

interface EmergencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmergencyModal = ({ open, onOpenChange }: EmergencyModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarranty, setSelectedWarranty] = useState<any>(null);

  // Fetch all warranties for search
  const { data: warranties, isLoading } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id)
        .order("warranty_end_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Filter warranties based on search
  const filteredWarranties = warranties?.filter((w) =>
    w.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get warranty status
  const getWarrantyStatus = (endDate: string) => {
    const daysLeft = differenceInDays(new Date(endDate), new Date());
    
    if (daysLeft < 0) {
      return {
        status: 'expired',
        label: 'EXPIRED',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        message: `Expired ${Math.abs(daysLeft)} days ago`,
        action: 'Try contacting support anyway - they sometimes help!'
      };
    } else if (daysLeft === 0) {
      return {
        status: 'today',
        label: 'EXPIRES TODAY!',
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        message: 'Last day of warranty!',
        action: 'FILE CLAIM IMMEDIATELY!'
      };
    } else if (daysLeft <= 7) {
      return {
        status: 'urgent',
        label: 'URGENT',
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        message: `${daysLeft} days left`,
        action: 'Act fast - warranty ending soon!'
      };
    } else {
      return {
        status: 'covered',
        label: 'COVERED',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        message: `${daysLeft} days left`,
        action: 'You\'re covered! Contact support now.'
      };
    }
  };

  // Generate support email
  const generateSupportEmail = (warranty: any) => {
    const subject = encodeURIComponent(`Warranty Claim: ${warranty.product_name}`);
    const body = encodeURIComponent(`Hello,

I purchased a ${warranty.brand || ''} ${warranty.product_name} ${warranty.model ? `(${warranty.model})` : ''} on ${format(new Date(warranty.purchase_date), 'MMMM d, yyyy')}.

Serial Number: ${warranty.serial_number || 'N/A'}
Purchase Store: ${warranty.store_name || 'N/A'}
Purchase Price: $${warranty.purchase_price || 'N/A'}

I am experiencing an issue with this product and would like to file a warranty claim.

Issue Description: [Please describe the problem]

Please advise on next steps.

Thank you.`);
    
    return `mailto:support@example.com?subject=${subject}&body=${body}`;
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedWarranty(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) handleReset();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-600" />
            Emergency Warranty Lookup
          </DialogTitle>
          <DialogDescription>
            Find your warranty quickly and get help now
          </DialogDescription>
        </DialogHeader>

        {!selectedWarranty ? (
          <div className="space-y-4 py-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="What broke? (e.g., TV, laptop, phone...)"
                className="pl-10 text-lg h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredWarranties && filteredWarranties.length > 0 ? (
                filteredWarranties.map((warranty) => {
                  const status = getWarrantyStatus(warranty.warranty_end_date);
                  const StatusIcon = status.icon;
                  
                  return (
                    <button
                      key={warranty.id}
                      onClick={() => setSelectedWarranty(warranty)}
                      className={`w-full text-left p-4 rounded-lg border-2 ${status.borderColor} ${status.bgColor} hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {warranty.brand} {warranty.product_name}
                          </h3>
                          {warranty.model && (
                            <p className="text-sm text-muted-foreground">Model: {warranty.model}</p>
                          )}
                          <p className="text-sm mt-1 font-medium ${status.color}">
                            {status.message}
                          </p>
                        </div>
                        <Badge variant="outline" className={`${status.color} border-current`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No warranties found for "{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground mt-2">Try a different search term</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Type to search your warranties</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Selected Warranty Details */}
            <div className={`p-4 rounded-lg border-2 ${getWarrantyStatus(selectedWarranty.warranty_end_date).borderColor} ${getWarrantyStatus(selectedWarranty.warranty_end_date).bgColor}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xl">
                  {selectedWarranty.brand} {selectedWarranty.product_name}
                </h3>
                <Badge variant="outline" className={`${getWarrantyStatus(selectedWarranty.warranty_end_date).color} border-current`}>
                  {getWarrantyStatus(selectedWarranty.warranty_end_date).label}
                </Badge>
              </div>
              
              {selectedWarranty.model && (
                <p className="text-sm"><strong>Model:</strong> {selectedWarranty.model}</p>
              )}
              {selectedWarranty.serial_number && (
                <p className="text-sm"><strong>Serial:</strong> {selectedWarranty.serial_number}</p>
              )}
              <p className="text-sm"><strong>Purchased:</strong> {format(new Date(selectedWarranty.purchase_date), 'MMM d, yyyy')}</p>
              <p className="text-sm"><strong>Warranty Ends:</strong> {format(new Date(selectedWarranty.warranty_end_date), 'MMM d, yyyy')}</p>
              {selectedWarranty.store_name && (
                <p className="text-sm"><strong>Store:</strong> {selectedWarranty.store_name}</p>
              )}
              
              <div className={`mt-3 p-3 rounded-md ${getWarrantyStatus(selectedWarranty.warranty_end_date).bgColor}`}>
                <p className={`font-semibold ${getWarrantyStatus(selectedWarranty.warranty_end_date).color}`}>
                  {getWarrantyStatus(selectedWarranty.warranty_end_date).action}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">QUICK ACTIONS</h4>
              
              <Button
                variant="default"
                className="w-full justify-start h-12"
                onClick={() => window.open(`tel:${selectedWarranty.store_phone || '1-800-000-0000'}`)}
              >
                <Phone className="h-4 w-4 mr-3" />
                Call Support
                {selectedWarranty.store_phone && (
                  <span className="ml-auto text-sm">{selectedWarranty.store_phone}</span>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => window.open(generateSupportEmail(selectedWarranty), '_blank')}
              >
                <Mail className="h-4 w-4 mr-3" />
                Email Support (Pre-filled)
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  try {
                    generateWarrantyPDF(selectedWarranty);
                    toast.success("📄 PDF downloaded successfully!");
                  } catch (error) {
                    console.error("PDF generation error:", error);
                    toast.error("Failed to generate PDF");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-3" />
                Download Receipt & Details (PDF)
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => window.open(getBarcodeSearchUrl(selectedWarranty.serial_number || selectedWarranty.product_name), '_blank')}
              >
                <Search className="h-4 w-4 mr-3" />
                Search for Support Online
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>

            {/* Back Button */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleReset}
            >
              ← Search Another Product
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper function (if not already available)
function getBarcodeSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' warranty support contact')}`;
}

