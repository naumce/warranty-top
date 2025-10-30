import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { WarrantyDurationPicker } from "./WarrantyDurationPicker";

interface EditWarrantyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warranty: {
    id: string;
    product_name: string;
    brand?: string | null;
    model?: string | null;
    serial_number?: string | null;
    purchase_date: string;
    warranty_end_date: string;
    store_name?: string | null;
    store_address?: string | null;
    store_city?: string | null;
    store_phone?: string | null;
    receipt_number?: string | null;
    purchase_price?: number | null;
    category?: string | null;
    notes?: string | null;
  };
}

const CATEGORIES = [
  "Electronics",
  "Appliances",
  "Furniture",
  "Tools",
  "Automotive",
  "Sports Equipment",
  "Musical Instruments",
  "Jewelry",
  "Other",
];

export const EditWarrantyDialog = ({ open, onOpenChange, warranty }: EditWarrantyDialogProps) => {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_name: warranty.product_name,
    brand: warranty.brand || "",
    model: warranty.model || "",
    serial_number: warranty.serial_number || "",
    purchase_date: warranty.purchase_date,
    warranty_end_date: warranty.warranty_end_date,
    store_name: warranty.store_name || "",
    store_address: warranty.store_address || "",
    store_city: warranty.store_city || "",
    store_phone: warranty.store_phone || "",
    receipt_number: warranty.receipt_number || "",
    purchase_price: warranty.purchase_price?.toString() || "",
    category: warranty.category || "Other",
    notes: warranty.notes || "",
  });

  // Reset form when warranty changes
  useEffect(() => {
    if (warranty) {
      setFormData({
        product_name: warranty.product_name,
        brand: warranty.brand || "",
        model: warranty.model || "",
        serial_number: warranty.serial_number || "",
        purchase_date: warranty.purchase_date,
        warranty_end_date: warranty.warranty_end_date,
        store_name: warranty.store_name || "",
        store_address: warranty.store_address || "",
        store_city: warranty.store_city || "",
        store_phone: warranty.store_phone || "",
        receipt_number: warranty.receipt_number || "",
        purchase_price: warranty.purchase_price?.toString() || "",
        category: warranty.category || "Other",
        notes: warranty.notes || "",
      });
    }
  }, [warranty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name || !formData.purchase_date || !formData.warranty_end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("warranties")
        .update({
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
          category: formData.category || null,
          notes: formData.notes || null,
        })
        .eq("id", warranty.id);

      if (error) throw error;

      toast.success("Warranty updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["warranties"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating warranty:", error);
      toast.error("Failed to update warranty");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Warranty</DialogTitle>
          <DialogDescription>Update warranty information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Product Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Warranty Period */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Warranty Period</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_end_date">Warranty End Date *</Label>
                <Input
                  id="warranty_end_date"
                  type="date"
                  value={formData.warranty_end_date}
                  onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <WarrantyDurationPicker
              purchaseDate={formData.purchase_date}
              onWarrantyEndDateChange={(endDate) => setFormData({ ...formData, warranty_end_date: endDate })}
            />
          </div>

          {/* Store Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Store Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name</Label>
                <Input
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_address">Store Address</Label>
                <Input
                  id="store_address"
                  value={formData.store_address}
                  onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store_city">Store City</Label>
                <Input
                  id="store_city"
                  value={formData.store_city}
                  onChange={(e) => setFormData({ ...formData, store_city: e.target.value })}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="store_phone">Store Phone</Label>
                <Input
                  id="store_phone"
                  type="tel"
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes about this warranty..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Warranty"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

