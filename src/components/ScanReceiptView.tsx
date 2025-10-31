import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, ScanBarcode, Keyboard } from "lucide-react";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";

import { extractReceiptData, ReceiptData } from "@/lib/receipt-ocr";

interface ScanReceiptViewProps {
  onImageCapture: (file: File) => void;
  onReceiptCapture: (file: File, ocrData?: ReceiptData) => void;
  onBarcodeScanned: (code: string, format?: string) => void;
  onManualEntry: () => void;
  onCancel: () => void;
}

export const ScanReceiptView = ({ onImageCapture, onReceiptCapture, onBarcodeScanned, onManualEntry, onCancel }: ScanReceiptViewProps) => {
  const [scanMode, setScanMode] = useState<'camera' | 'barcode' | 'receipt' | null>(null);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const startBarcodeScanner = async () => {
    setScanMode('barcode');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image too large. Max size is 10MB");
        return;
      }
      onImageCapture(file);
    }
  };

  const handleReceiptCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max size is 10MB");
      return;
    }

    setProcessingReceipt(true);
    toast.loading("📄 Processing receipt with AI OCR...", { id: 'receipt-ocr' });

    try {
      const ocrData = await extractReceiptData(file);
      
      if (ocrData) {
        toast.success("✅ Receipt data extracted!", { 
          id: 'receipt-ocr',
          description: `Found: ${ocrData.storeName || 'Store'} - $${ocrData.total || '?'}`
        });
        onReceiptCapture(file, ocrData);
      } else {
        toast.info("Receipt captured (OCR not available)", { 
          id: 'receipt-ocr',
          description: "You can fill in details manually"
        });
        onReceiptCapture(file);
      }
    } catch (error) {
      console.error("Receipt processing error:", error);
      toast.error("OCR failed, but receipt saved", { 
        id: 'receipt-ocr',
        description: "Fill in details manually"
      });
      onReceiptCapture(file);
    } finally {
      setProcessingReceipt(false);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleReceiptClick = () => {
    if (receiptInputRef.current) {
      receiptInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {scanMode === 'barcode' ? (
        <BarcodeScanner
          onScan={(text, format) => {
            onBarcodeScanned(text, format);
            toast.success(`Barcode scanned: ${text}`);
            setScanMode(null);
          }}
          onClose={() => setScanMode(null)}
        />
      ) : (
        <>
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold mb-2">Add Warranty</h3>
            <p className="text-sm text-muted-foreground">
              Choose how you want to add your warranty information
            </p>
          </div>

          <div className="grid gap-3">
            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 hover:border-success hover:bg-accent"
              onClick={handleReceiptClick}
              disabled={processingReceipt}
            >
              <Upload className="h-8 w-8 text-success" />
              <div>
                <div className="font-semibold">📄 Upload Receipt (AI OCR)</div>
                <div className="text-xs text-muted-foreground">
                  Auto-extract store, date, price, and items
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-accent"
              onClick={startBarcodeScanner}
            >
              <ScanBarcode className="h-8 w-8" />
              <div>
                <div className="font-semibold">Scan Barcode/QR</div>
                <div className="text-xs text-muted-foreground">Quick product lookup</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-accent"
              onClick={handleCameraCapture}
            >
              <Camera className="h-8 w-8" />
              <div>
                <div className="font-semibold">Take Photo</div>
                <div className="text-xs text-muted-foreground">Capture product image</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-accent"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8" />
              <div>
                <div className="font-semibold">Upload Image</div>
                <div className="text-xs text-muted-foreground">Select from gallery</div>
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2 border-2 border-dashed hover:border-primary hover:bg-accent"
              onClick={onManualEntry}
            >
              <Keyboard className="h-6 w-6" />
              <div>
                <div className="font-semibold">Manual Entry</div>
                <div className="text-xs text-muted-foreground">Type in all details</div>
              </div>
            </Button>
          </div>

          <input
            ref={receiptInputRef}
            type="file"
            accept="image/*"
            onChange={handleReceiptCapture}
            className="hidden"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button variant="ghost" onClick={onCancel} className="mt-2">
            Cancel
          </Button>
        </>
      )}
    </div>
  );
};
