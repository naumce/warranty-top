import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  Save,
  Camera,
  Upload,
  X,
  Sparkles,
  ChevronDown,
  Phone,
  Mail,
  Search,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uploadWarrantyImage, saveImageMetadata, deleteWarrantyImage } from "@/lib/storage";
import { WarrantyDurationPicker } from "@/components/WarrantyDurationPicker";
import { useUserLimits } from "@/hooks/useUserLimits";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface Warranty {
  id: string;
  product_name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_end_date?: string;
  store_name?: string;
  store_address?: string;
  store_city?: string;
  store_phone?: string;
  receipt_number?: string;
  purchase_price?: number;
  notes?: string;
  created_at: string;
}

interface WarrantyImage {
  id: string;
  image_url: string;
  storage_path: string;
  image_type: string;
  is_primary: boolean;
  caption?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

export default function WarrantyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userLimits } = useUserLimits();
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [images, setImages] = useState<WarrantyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    warranty: true,
    product: true,
    purchase: false,
    notes: false,
    images: true,
    metadata: false,
  });
  
  // Editable form data
  const [formData, setFormData] = useState({
    product_name: "",
    brand: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    warranty_end_date: "",
    store_name: "",
    store_address: "",
    store_city: "",
    store_phone: "",
    receipt_number: "",
    purchase_price: "",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      fetchWarrantyDetails();
    }
  }, [id]);

  // Page load animation
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const fetchWarrantyDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch warranty
      const { data: warrantyData, error: warrantyError } = await supabase
        .from("warranties")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (warrantyError) {
        toast.error("Warranty not found");
        navigate("/dashboard");
        return;
      }

      setWarranty(warrantyData);
      
      // Populate form data
      setFormData({
        product_name: warrantyData.product_name || "",
        brand: warrantyData.brand || "",
        model: warrantyData.model || "",
        serial_number: warrantyData.serial_number || "",
        purchase_date: warrantyData.purchase_date || "",
        warranty_end_date: warrantyData.warranty_end_date || "",
        store_name: warrantyData.store_name || "",
        store_address: warrantyData.store_address || "",
        store_city: warrantyData.store_city || "",
        store_phone: warrantyData.store_phone || "",
        receipt_number: warrantyData.receipt_number || "",
        purchase_price: warrantyData.purchase_price?.toString() || "",
        notes: warrantyData.notes || "",
      });

      // Fetch images
      const { data: imagesData } = await supabase
        .from("warranty_images")
        .select("*")
        .eq("warranty_id", id)
        .order("is_primary", { ascending: false })
        .order("uploaded_at", { ascending: true });

      if (imagesData) {
        setImages(imagesData);
      }
    } catch (error) {
      console.error("Error fetching warranty:", error);
      toast.error("Failed to load warranty details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!warranty) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("warranties")
        .update({
          product_name: formData.product_name,
          brand: formData.brand || null,
          model: formData.model || null,
          serial_number: formData.serial_number || null,
          purchase_date: formData.purchase_date || null,
          warranty_end_date: formData.warranty_end_date || null,
          store_name: formData.store_name || null,
          store_address: formData.store_address || null,
          store_city: formData.store_city || null,
          store_phone: formData.store_phone || null,
          receipt_number: formData.receipt_number || null,
          purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
          notes: formData.notes || null,
        })
        .eq("id", warranty.id);

      if (error) throw error;

      toast.success("Warranty updated successfully!");
      setHasChanges(false);
      fetchWarrantyDetails(); // Refresh data
    } catch (error) {
      console.error("Error updating warranty:", error);
      toast.error("Failed to update warranty");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !warranty) return;

    // Check photo limit
    const maxPhotos = userLimits?.max_photos_per_warranty || 2;
    const currentPhotoCount = images.length;
    const availableSlots = maxPhotos - currentPhotoCount;

    if (availableSlots <= 0) {
      toast.error(`Photo limit reached (${maxPhotos} photos per warranty)`, {
        description: "Upgrade to add more photos",
        action: {
          label: "Upgrade",
          onClick: () => setShowUpgradePrompt(true)
        }
      });
      return;
    }

    if (files.length > availableSlots) {
      toast.error(`Can only add ${availableSlots} more photo(s)`, {
        description: `Your ${userLimits?.tier || 'FREE'} plan allows ${maxPhotos} photos per warranty`,
        action: {
          label: "Upgrade",
          onClick: () => setShowUpgradePrompt(true)
        }
      });
      return;
    }

    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} file(s) too large. Max size is 10MB per file.`);
      return;
    }

    toast.info(`Uploading ${files.length} photo(s)...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadWarrantyImage(file, warranty.id, 'product');
        if (result) {
          await saveImageMetadata(
            warranty.id,
            result.url,
            result.path,
            'product',
            undefined,
            images.length === 0 && i === 0, // First photo if no images exist
            file.size,
            file.type
          );
        }
      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    toast.success("Photos uploaded successfully!");
    fetchWarrantyDetails(); // Refresh to show new images
  };

  const handleDeleteImage = async (image: WarrantyImage) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      // Delete from storage using the storage_path
      const storageDeleted = await deleteWarrantyImage(image.storage_path);
      
      // Delete from database
      const { error } = await supabase
        .from("warranty_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      toast.success("Photo deleted successfully");
      fetchWarrantyDetails(); // Refresh images
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete photo");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this warranty? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("warranties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Warranty deleted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error deleting warranty:", error);
      toast.error("Failed to delete warranty");
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const isExpired = formData.warranty_end_date 
    ? new Date(formData.warranty_end_date) < new Date() 
    : false;

  const daysUntilExpiry = formData.warranty_end_date
    ? Math.ceil((new Date(formData.warranty_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading warranty details...</p>
        </div>
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Warranty Not Found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen bg-gradient-to-br from-background via-accent to-background
      transition-all duration-700 ease-out
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {/* Header - Compact Mobile Design */}
      <div className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-4">
          {/* Top Row: Back + Title + Action Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 active:scale-95 transition-transform duration-150"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Title - Compact on mobile */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-2xl font-bold truncate leading-tight">
                {formData.product_name || "Warranty Details"}
              </h1>
              {(formData.brand || formData.model) && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {formData.brand && formData.model && `${formData.brand} ${formData.model}`}
                  {formData.brand && !formData.model && !formData.product_name.toLowerCase().includes(formData.brand.toLowerCase()) && formData.brand}
                </p>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/support/${id}`)}
                className="min-h-[44px] active:scale-95 transition-transform duration-150"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Support
              </Button>
              {hasChanges && (
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-primary min-h-[44px] active:scale-95 transition-transform duration-150 animate-in fade-in slide-in-from-top-2"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                className="min-h-[44px] active:scale-95 transition-transform duration-150"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* Mobile: Icon-only Actions */}
            <div className="flex sm:hidden gap-1 shrink-0">
              {hasChanges && (
                <Button 
                  size="icon"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 w-10 bg-gradient-primary active:scale-95 transition-transform duration-150 animate-in fade-in slide-in-from-top-2"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              <Button 
                size="icon"
                variant="outline"
                onClick={() => navigate(`/support/${id}`)}
                className="h-10 w-10 active:scale-95 transition-transform duration-150"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon"
                onClick={handleDelete}
                className="h-10 w-10 active:scale-95 transition-transform duration-150"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warranty Status Card */}
            <Collapsible 
              open={openSections.warranty} 
              onOpenChange={(open) => setOpenSections({...openSections, warranty: open})}
            >
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Warranty Status</CardTitle>
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections.warranty ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => updateFormData('purchase_date', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <WarrantyDurationPicker
                      purchaseDate={formData.purchase_date}
                      warrantyEndDate={formData.warranty_end_date}
                      onWarrantyEndDateChange={(date) => updateFormData('warranty_end_date', date)}
                      defaultUnit="months"
                    />
                  </div>

                  {formData.warranty_end_date && (
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <Badge variant={isExpired ? "destructive" : "default"}>
                          {isExpired ? "Expired" : "Active"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expires</span>
                        <span className="text-sm font-medium">
                          {new Date(formData.warranty_end_date).toLocaleDateString()}
                        </span>
                      </div>
                      {!isExpired && daysUntilExpiry !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Time Remaining</span>
                          <span className="text-sm font-medium">
                            {daysUntilExpiry} days
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Actions - Mobile First */}
                  {!isExpired && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Quick Actions
                      </h4>
                      
                      {/* AI Support - Hero Action */}
                      <Button
                        onClick={() => navigate(`/support/${id}`)}
                        className="w-full bg-gradient-primary hover:opacity-90 min-h-[48px] text-base font-semibold active:scale-[0.98] transition-all duration-150"
                      >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Get AI Help Now
                      </Button>

                      {/* Secondary Actions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {warranty.store_phone && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(`tel:${warranty.store_phone}`)}
                            className="min-h-[44px] justify-start active:scale-[0.98] transition-all duration-150"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Support
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            const subject = encodeURIComponent(`Support for ${warranty.product_name}`);
                            const body = encodeURIComponent(`Product: ${warranty.product_name}\nSerial: ${warranty.serial_number || 'N/A'}\nPurchase Date: ${warranty.purchase_date}\n\nIssue: `);
                            window.open(`mailto:${warranty.store_email || 'support@example.com'}?subject=${subject}&body=${body}`);
                          }}
                          className="min-h-[44px] justify-start active:scale-[0.98] transition-all duration-150"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email Support
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const searchQuery = `${warranty.brand || ''} ${warranty.product_name} support`;
                            window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
                          }}
                          className="min-h-[44px] justify-start active:scale-[0.98] transition-all duration-150"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Search Online
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => window.print()}
                          className="min-h-[44px] justify-start active:scale-[0.98] transition-all duration-150"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Product Details */}
            <Collapsible 
              open={openSections.product} 
              onOpenChange={(open) => setOpenSections({...openSections, product: open})}
            >
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '200ms' }}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Product Details</CardTitle>
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections.product ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => updateFormData('product_name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => updateFormData('brand', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => updateFormData('model', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serial_number">Serial Number / Barcode</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => updateFormData('serial_number', e.target.value)}
                    className="font-mono"
                  />
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Purchase Information */}
            <Collapsible 
              open={openSections.purchase} 
              onOpenChange={(open) => setOpenSections({...openSections, purchase: open})}
            >
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '300ms' }}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Purchase Information</CardTitle>
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections.purchase ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                      id="store_name"
                      value={formData.store_name}
                      onChange={(e) => updateFormData('store_name', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => updateFormData('purchase_price', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="store_address">Store Address</Label>
                  <Input
                    id="store_address"
                    value={formData.store_address}
                    onChange={(e) => updateFormData('store_address', e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="store_city">City</Label>
                    <Input
                      id="store_city"
                      value={formData.store_city}
                      onChange={(e) => updateFormData('store_city', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="store_phone">Phone</Label>
                    <Input
                      id="store_phone"
                      type="tel"
                      value={formData.store_phone}
                      onChange={(e) => updateFormData('store_phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="receipt_number">Receipt Number</Label>
                  <Input
                    id="receipt_number"
                    value={formData.receipt_number}
                    onChange={(e) => updateFormData('receipt_number', e.target.value)}
                    className="font-mono"
                  />
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Notes */}
            <Collapsible 
              open={openSections.notes} 
              onOpenChange={(open) => setOpenSections({...openSections, notes: open})}
            >
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Notes</CardTitle>
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections.notes ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      placeholder="Add any additional notes about this warranty..."
                      rows={5}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <Collapsible 
              open={openSections.images} 
              onOpenChange={(open) => setOpenSections({...openSections, images: open})}
            >
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '100ms' }}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-lg font-semibold">Photos ({images.length}/{userLimits?.max_photos_per_warranty || 2})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {images.length >= (userLimits?.max_photos_per_warranty || 2) && (
                          <Badge variant="secondary" className="text-xs">
                            Limit reached
                          </Badge>
                        )}
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections.images ? '' : '-rotate-90'}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                {/* Upload buttons */}
                <div className="flex gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex-1 min-h-[44px] active:scale-95 transition-transform duration-150"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photos
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (photoInputRef.current) {
                        photoInputRef.current.accept = "image/*";
                        photoInputRef.current.capture = "environment" as any;
                        photoInputRef.current.click();
                      }
                    }}
                    className="md:hidden min-h-[44px] min-w-[44px] active:scale-95 transition-transform duration-150"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* Photo grid */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div 
                        key={image.id} 
                        className="relative group aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-all duration-300 animate-in fade-in zoom-in-95"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <img
                          src={image.image_url}
                          alt={image.caption || image.storage_path}
                          className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300"
                          onClick={() => window.open(image.image_url, '_blank')}
                        />
                        {image.is_primary && (
                          <Badge className="absolute top-2 left-2 text-xs bg-gradient-primary">Primary</Badge>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No photos attached yet. Click above to add photos.
                  </p>
                )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Metadata */}
            <Collapsible 
              open={openSections.metadata} 
              onOpenChange={(open) => setOpenSections({...openSections, metadata: open})}
            >
              <Card className="animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '200ms' }}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Metadata</CardTitle>
                      <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${openSections.metadata ? '' : '-rotate-90'}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(warranty.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Warranty ID</p>
                  <p className="font-mono text-xs break-all">{warranty.id}</p>
                </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        reason="You've reached your photo limit. Upgrade to add more photos per warranty."
        currentTier={userLimits?.tier || 'free'}
        triggerFeature="storage"
      />
    </div>
  );
}
