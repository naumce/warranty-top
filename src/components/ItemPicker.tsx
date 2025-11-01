import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Package } from "lucide-react";
import { ReceiptData } from "@/lib/receipt-ocr";

interface ItemPickerProps {
  receiptData: ReceiptData;
  onItemSelect: (item: { name: string; price?: number }, receiptData: ReceiptData) => void;
  onSkip: () => void;
}

export const ItemPicker = ({ receiptData, onItemSelect, onSkip }: ItemPickerProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const items = receiptData.items || [];

  if (items.length === 0) {
    return null;
  }

  const handleSelect = () => {
    if (selectedIndex !== null && items[selectedIndex]) {
      onItemSelect(items[selectedIndex], receiptData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Package className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Multiple Items Found</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          We found {items.length} item{items.length > 1 ? 's' : ''} on this receipt. Which one would you like to add?
        </p>
      </div>

      {/* Receipt Info */}
      {(receiptData.storeName || receiptData.purchaseDate) && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between text-sm">
              {receiptData.storeName && (
                <span className="font-medium">{receiptData.storeName}</span>
              )}
              {receiptData.purchaseDate && (
                <span className="text-muted-foreground">
                  {new Date(receiptData.purchaseDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {receiptData.total && (
              <div className="text-xs text-muted-foreground mt-1">
                Total: ${receiptData.total.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {items.map((item, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedIndex === index
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {item.name}
                    </p>
                    {item.quantity && item.quantity > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        x{item.quantity}
                      </Badge>
                    )}
                  </div>
                  {item.price && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${item.price.toFixed(2)}
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-xs ml-1">
                          (${(item.price / item.quantity).toFixed(2)} each)
                        </span>
                      )}
                    </p>
                  )}
                </div>
                {selectedIndex === index && (
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1"
        >
          Skip & Enter Manually
        </Button>
        <Button
          onClick={handleSelect}
          disabled={selectedIndex === null}
          className="flex-1 bg-gradient-primary"
        >
          Continue with Selected
        </Button>
      </div>
    </div>
  );
};

