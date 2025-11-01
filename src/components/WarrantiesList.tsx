import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WarrantyCard } from "./WarrantyCard";
import { MobileWarrantyCard } from "./MobileWarrantyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Download, Trash2, SortAsc, X, CheckSquare } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { differenceInDays, format } from "date-fns";
import { toast } from "sonner";

interface WarrantiesListProps {
  initialStatusFilter?: string;
}

export const WarrantiesList = ({ initialStatusFilter = "all" }: WarrantiesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [sortBy, setSortBy] = useState<string>("expiry_asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectMode, setSelectMode] = useState(false); // Toggle for bulk operations

  // Update filter when prop changes
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const { data: warranties, isLoading } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id)
        .order("warranty_end_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredWarranties = useMemo(() => {
    if (!warranties) return [];

    let filtered = warranties.filter((warranty) => {
      // Search filter
      const matchesSearch =
        warranty.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warranty.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warranty.model?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== "all") {
      const today = new Date();
      const endDate = new Date(warranty.warranty_end_date);
      const daysUntilExpiry = differenceInDays(endDate, today);

        if (statusFilter === "active" && daysUntilExpiry <= 30) return false;
        if (statusFilter === "expiring" && (daysUntilExpiry < 0 || daysUntilExpiry > 30)) return false;
        if (statusFilter === "expired" && daysUntilExpiry >= 0) return false;
      }

      // Category filter
      if (categoryFilter !== "all") {
        const warrantyCat = warranty.category || "Other";
        if (warrantyCat !== categoryFilter) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "expiry_asc":
          return new Date(a.warranty_end_date).getTime() - new Date(b.warranty_end_date).getTime();
        case "expiry_desc":
          return new Date(b.warranty_end_date).getTime() - new Date(a.warranty_end_date).getTime();
        case "value_desc":
          return (b.purchase_price || 0) - (a.purchase_price || 0);
        case "value_asc":
          return (a.purchase_price || 0) - (b.purchase_price || 0);
        case "name_asc":
          return a.product_name.localeCompare(b.product_name);
        case "name_desc":
          return b.product_name.localeCompare(a.product_name);
        case "recent":
          return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [warranties, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!warranties) return [];
    const cats = new Set(warranties.map((w) => w.category || "Other"));
    return Array.from(cats).sort();
  }, [warranties]);

  // Export to CSV
  const handleExportCSV = () => {
    const warrantiesToExport = selectedIds.length > 0
      ? filteredWarranties.filter((w) => selectedIds.includes(w.id))
      : filteredWarranties;

    if (warrantiesToExport.length === 0) {
      toast.error("No warranties to export");
      return;
    }

    const headers = [
      "Product Name",
      "Brand",
      "Model",
      "Serial Number",
      "Purchase Date",
      "Warranty End Date",
      "Store Name",
      "Purchase Price",
      "Category",
      "Notes",
    ];

    const rows = warrantiesToExport.map((w) => [
      w.product_name,
      w.brand || "",
      w.model || "",
      w.serial_number || "",
      format(new Date(w.purchase_date), "yyyy-MM-dd"),
      format(new Date(w.warranty_end_date), "yyyy-MM-dd"),
      w.store_name || "",
      w.purchase_price || "",
      w.category || "",
      w.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warranties_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${warrantiesToExport.length} warranties to CSV`);
    setSelectedIds([]);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("No warranties selected");
      return;
    }

    if (!confirm(`Delete ${selectedIds.length} warranties? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from("warranties").delete().in("id", selectedIds);
      
      if (error) throw error;

      toast.success(`Deleted ${selectedIds.length} warranties`);
      setSelectedIds([]);
      
      // Refresh the list
      window.location.reload();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete warranties");
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredWarranties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWarranties.map((w) => w.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Mobile: Compact Search/Filter - Desktop: Full Controls */}
      <div className="hidden sm:block space-y-3">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warranties..."
              className="pl-10 h-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 h-10 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry_asc">Expiry (Soonest)</SelectItem>
                <SelectItem value="expiry_desc">Expiry (Latest)</SelectItem>
                <SelectItem value="value_desc">Value (High-Low)</SelectItem>
                <SelectItem value="value_asc">Value (Low-High)</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Filter Chips */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Category:</span>
            <Badge
              variant={categoryFilter === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter("all")}
            >
              All
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Bulk Actions Bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectMode(!selectMode);
                if (selectMode) setSelectedIds([]); // Clear selection when exiting
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectMode ? "Cancel" : "Select"}
            </Button>
            
            {selectMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                >
                  {selectedIds.length === filteredWarranties.length ? "Deselect All" : "Select All"}
                </Button>
                
                {selectedIds.length > 0 && (
                  <>
                    <Badge variant="secondary">
                      {selectedIds.length} selected
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
          
          {!selectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          )}
        </div>

      </div>

      {/* Warranties Grid - IMMEDIATELY VISIBLE ON MOBILE */}
      {filteredWarranties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || statusFilter !== "all" ? "No warranties found" : "No warranties yet"}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Start tracking your warranties by adding your first product"}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Compact collapsible cards */}
          <div className="sm:hidden space-y-3">
            {filteredWarranties.map((warranty, index) => (
              <MobileWarrantyCard key={warranty.id} warranty={warranty} index={index} />
            ))}
          </div>

          {/* Desktop: Full cards with optional checkboxes */}
          <div className="hidden sm:block space-y-4">
            {filteredWarranties.map((warranty) => (
              <div key={warranty.id} className="flex items-start gap-3">
                {selectMode && (
                  <div className="pt-6 shrink-0">
                    <Checkbox
                      checked={selectedIds.includes(warranty.id)}
                      onCheckedChange={() => toggleSelection(warranty.id)}
                      className="h-5 w-5"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <WarrantyCard warranty={warranty} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
