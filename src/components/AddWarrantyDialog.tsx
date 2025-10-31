import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, ArrowLeft, Keyboard, Search, ExternalLink } from "lucide-react";
import { ScanReceiptView } from "./ScanReceiptView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lookupBarcode, getBarcodeSearchUrl, getGoogleShoppingUrl, getAmazonSearchUrl } from "@/lib/barcode-lookup";
import { smartAILookup } from "@/lib/ai-barcode-lookup";
import { ReceiptData } from "@/lib/receipt-ocr";
import { WarrantyDurationPicker } from "./WarrantyDurationPicker";
import { useUserLimits } from "@/hooks/useUserLimits";
import { UpgradePrompt } from "./UpgradePrompt";

export const AddWarrantyDialog = () => {
  const queryClient = useQueryClient();
  const { canAddWarranty, canUseAILookup, canUseOCR, incrementOCRUsage } = useUserLimits();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'scan' | 'manual'>('scan');
  const [scannerActive, setScannerActive] = useState(false);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [receiptOCRData, setReceiptOCRData] = useState<ReceiptData | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [upgradeTier, setUpgradeTier] = useState("free");
  
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
    purchase_price: "",
    receipt_number: "",
    notes: "",
  });

  const handleImageCapture = (file: File) => {
    setReceiptImage(file);
    setView('manual');
    toast.success("Product image captured!");
  };

  const handleReceiptCapture = (file: File, ocrData?: ReceiptData) => {
    setReceiptImage(file);
    setReceiptOCRData(ocrData || null);
    setView('manual');

    if (ocrData) {
      // Increment OCR usage count (for tier tracking)
      incrementOCRUsage();
      
      // Auto-fill form with OCR data
      setFormData(prev => ({
        ...prev,
        store_name: ocrData.storeName || prev.store_name,
        store_address: ocrData.storeAddress || prev.store_address,
        store_city: ocrData.storeCity || prev.store_city,
        store_phone: ocrData.storePhone || prev.store_phone,
        receipt_number: ocrData.receiptNumber || prev.receipt_number,
        purchase_date: ocrData.purchaseDate || prev.purchase_date,
        purchase_price: ocrData.total?.toString() || prev.purchase_price,
        notes: ocrData.items && ocrData.items.length > 0
          ? `Items from receipt:\n${ocrData.items.map(item => `- ${item.name} ${item.price ? `($${item.price})` : ''}`).join('\n')}`
          : prev.notes,
      }));

      toast.success(`🎉 Auto-filled from receipt!`, {
        description: `${ocrData.storeName || 'Store'} - ${ocrData.purchaseDate || 'Date'}`,
      });
    }
  };

  const handleBarcodeScanned = async (code: string, barcodeFormat?: string) => {
    setScannedBarcode(code);
    
    // 🔍 CHECK IF WARRANTY WITH THIS BARCODE ALREADY EXISTS
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingWarranty } = await supabase
        .from('warranties')
        .select('*')
        .eq('user_id', user.id)
        .eq('serial_number', code)
        .single();
      
      if (existingWarranty) {
        toast.warning("Warranty with this barcode already exists!", {
          description: `${existingWarranty.product_name || 'Product'} - Click to view`,
          duration: 6000,
          action: {
            label: "View",
            onClick: () => {
              setOpen(false);
              // Scroll to warranty card (if visible on dashboard)
              setTimeout(() => {
                const card = document.getElementById(`warranty-${existingWarranty.id}`);
                card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }
          }
        });
        return; // Stop here, don't proceed with adding
      }
    }
    
    setFormData({ ...formData, serial_number: code });
    setView('manual');
    
    // Check AI lookup limit
    const aiLookupCheck = canUseAILookup();
    
    // Try AI-powered lookup first (if allowed)
    if (aiLookupCheck.allowed) {
      toast.loading(`🤖 AI is researching barcode ${code}...`, { id: 'barcode-lookup' });
      
      try {
        // First: Try AI lookup (best results)
        const aiResult = await smartAILookup(code, barcodeFormat);
      
      if (aiResult) {
        toast.success(`🤖 AI found it!`, {
          id: 'barcode-lookup',
          description: `${aiResult.brand || ""} ${aiResult.productName || ""}`.trim(),
        });
        
        // Auto-fill form with AI data
        setFormData(prev => ({
          ...prev,
          serial_number: code,
          product_name: aiResult.productName || prev.product_name,
          brand: aiResult.brand || prev.brand,
          model: aiResult.model || prev.model,
          notes: [
            aiResult.description,
            aiResult.estimatedWarrantyPeriod ? `Typical warranty: ${aiResult.estimatedWarrantyPeriod}` : null,
            `Source: ${aiResult.source} (AI-powered)`,
          ].filter(Boolean).join('\n\n'),
        }));
        return;
      }
      
      } catch (error) {
        console.error("AI lookup error:", error);
      }
    } else {
      // AI lookup not allowed - show upgrade message
      toast.info(aiLookupCheck.reason, {
        id: 'barcode-lookup',
        description: "Trying free databases...",
      });
    }
    
    // Second: Try free barcode APIs (fallback, always runs)
    toast.loading(`Checking product databases...`, { id: 'barcode-lookup' });
    
    try {
      const productInfo = await lookupBarcode(code);
      
      if (productInfo) {
        const foundItems = [];
        if (productInfo.productName) foundItems.push("name");
        if (productInfo.brand) foundItems.push("brand");
        if (productInfo.model) foundItems.push("model");
        
        toast.success(`Found: ${foundItems.join(", ") || "partial data"}`, {
          id: 'barcode-lookup',
          description: `${productInfo.brand || ""} ${productInfo.productName || ""}`.trim() || "Check the form",
        });
        
        // Auto-fill form with found data
        setFormData(prev => ({
          ...prev,
          serial_number: code,
          product_name: productInfo.productName || prev.product_name,
          brand: productInfo.brand || prev.brand,
          model: productInfo.model || prev.model,
          notes: productInfo.description 
            ? `${productInfo.description}\n\nSource: ${productInfo.source}` 
            : prev.notes,
        }));
        return;
      }
      
      // Nothing found - show manual search options
      toast.error("Product not found", {
        id: 'barcode-lookup',
        description: "Use search buttons below or enter manually",
      });
      
      // Still set the barcode as serial number
      setFormData(prev => ({
        ...prev,
        serial_number: code,
      }));
      
    } catch (error) {
      console.error("Free API lookup error:", error);
      toast.error("Product lookup failed", {
        id: 'barcode-lookup',
        description: "Please enter manually",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("warranties").insert({
      user_id: user.id,
      product_name: formData.product_name,
      brand: formData.brand || null,
      model: formData.model || null,
      serial_number: formData.serial_number || null,
      purchase_date: formData.purchase_date,
      warranty_end_date: formData.warranty_end_date,
      store_name: formData.store_name || null,
      store_address: formData.store_address || null,
      store_city: formData.store_city || null,
      store_phone: formData.store_phone || null,
      receipt_number: formData.receipt_number || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      notes: formData.notes || null,
      receipt_ocr_data: receiptOCRData ? JSON.stringify(receiptOCRData) : null,
    });

    if (error) {
      toast.error("Failed to add warranty");
      console.error(error);
    } else {
      toast.success("Warranty added successfully!");
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      setOpen(false);
      resetForm();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
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
      purchase_price: "",
      receipt_number: "",
      notes: "",
    });
    setView('scan');
    setReceiptImage(null);
    setScannedBarcode("");
    setReceiptOCRData(null);
  };

  const handleOpenDialog = () => {
    console.log('🔥 ADD WARRANTY BUTTON CLICKED');
    // Check if user can add warranty
    const check = canAddWarranty();
    console.log('🔥 Can add warranty check:', check);
    
    if (!check.allowed) {
      console.log('🔥 NOT ALLOWED - showing upgrade prompt');
      // Show upgrade prompt
      setUpgradeReason(check.reason);
      setUpgradeTier((check as any).currentTier || 'free');
      setShowUpgradePrompt(true);
      return;
    }
    
    console.log('🔥 OPENING DIALOG');
    // Open dialog
    setOpen(true);
  };

  return (
    <>
      <Button 
        className="bg-gradient-primary hover:opacity-90 transition-opacity"
        onClick={handleOpenDialog}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Warranty
      </Button>
      
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset view to scan mode to stop any active scanner
          setView('scan');
          setScannerActive(false);
          resetForm();
        }
        setOpen(isOpen);
      }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        {view === 'scan' ? (
          <ScanReceiptView
            onImageCapture={handleImageCapture}
            onReceiptCapture={handleReceiptCapture}
            onBarcodeScanned={(code, format) => {
              handleBarcodeScanned(code, format);
              setScannerActive(false);
            }}
            onManualEntry={() => setView('manual')}
            onCancel={() => setOpen(false)}
            onScannerStateChange={setScannerActive}
          />
        ) : (
          <>
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView('scan')}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Warranty Details</DialogTitle>
              </div>
              <DialogDescription>
                {receiptImage ? "Receipt captured! " : scannedBarcode ? "Barcode scanned! " : ""}
                Fill in the warranty information below.
              </DialogDescription>
              
              {scannedBarcode && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Barcode: {scannedBarcode}</p>
                  <p className="text-xs text-muted-foreground mb-2">Search for product info:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getBarcodeSearchUrl(scannedBarcode), '_blank')}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Google
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getGoogleShoppingUrl(scannedBarcode), '_blank')}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Shopping
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getAmazonSearchUrl(scannedBarcode), '_blank')}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      Amazon
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-6 pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    placeholder="Samsung 55-inch TV"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="Samsung"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="UN55TU7000"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    placeholder="ABC123456789"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="purchase_date">Purchase Date *</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    required
                  />
                </div>

                <WarrantyDurationPicker
                  purchaseDate={formData.purchase_date}
                  onWarrantyEndDateChange={(endDate) => setFormData({ ...formData, warranty_end_date: endDate })}
                  defaultDuration={12}
                  defaultUnit="months"
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                      id="store_name"
                      placeholder="Best Buy"
                      value={formData.store_name}
                      onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      placeholder="499.99"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6 gap-2">
                <Button type="button" variant="outline" onClick={() => setView('scan')}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Warranty"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
    
    {/* Upgrade Prompt Modal */}
    <UpgradePrompt
      open={showUpgradePrompt}
      onOpenChange={setShowUpgradePrompt}
      reason={upgradeReason}
      currentTier={upgradeTier}
      triggerFeature="warranty"
    />
    </>
  );
};
