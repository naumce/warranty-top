import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, ScanBarcode, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const startBarcodeScanner = async () => {
    setScanMode('barcode');
  };

  useEffect(() => {
    if (scanMode === 'barcode') {
      // Wait for the DOM to update before initializing the scanner
      const initScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode("barcode-scanner");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 20, // Increased FPS for better detection
              qrbox: { width: 350, height: 150 }, // Optimized for linear barcodes
              aspectRatio: 2.33, // Better for standard barcodes
              disableFlip: false,
              // Focus on common product barcode formats
              formatsToSupport: [
                9,  // EAN_13 (Most common - Europe)
                10, // EAN_8
                14, // UPC_A (Most common - USA)
                15, // UPC_E
                5,  // CODE_128 (Common for retail)
                3,  // CODE_39
                0,  // QR_CODE (for product QR codes)
                8,  // ITF (interleaved 2 of 5)
                4,  // CODE_93
                1,  // AZTEC
                2,  // CODABAR
                6,  // DATA_MATRIX
                7,  // MAXICODE
                11, // PDF_417
                12, // RSS_14
                13, // RSS_EXPANDED
                16, // UPC_EAN_EXTENSION
              ],
            },
            (decodedText, decodedResult) => {
              console.log("==========================================");
              console.log("🔥 BARCODE SCANNED SUCCESSFULLY!");
              console.log("==========================================");
              console.log("📦 Decoded Text (Barcode Value):", decodedText);
              console.log("📊 Full Decoded Result Object:", decodedResult);
              console.log("📋 Result Format:", decodedResult?.result?.format);
              console.log("📋 Format Name:", decodedResult?.result?.format?.formatName);
              console.log("📋 Result Text:", decodedResult?.result?.text);
              console.log("📋 Decoded Result:", JSON.stringify(decodedResult, null, 2));
              console.log("==========================================");
              
              const formatName = decodedResult?.result?.format?.formatName;
              onBarcodeScanned(decodedText, formatName);
              stopScanner();
              toast.success(`Barcode scanned: ${decodedText}`);
            },
            (error) => {
              // Ignore scan errors, they happen continuously
            }
          );
        } catch (err) {
          console.error("Error starting scanner:", err);
          toast.error("Camera access denied or not available");
          setScanMode(null);
        }
      };

      initScanner();
    }

    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [scanMode]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanMode(null);
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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scan Barcode/QR Code</h3>
            <Button variant="ghost" size="icon" onClick={stopScanner}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div id="barcode-scanner" ref={videoRef} className="w-full rounded-lg overflow-hidden" />
          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p className="font-medium">Point your camera at the barcode</p>
            <ul className="text-xs space-y-1">
              <li>• Keep the barcode within the green box</li>
              <li>• Hold steady and ensure good lighting</li>
              <li>• Try moving closer or further away</li>
              <li>• Make sure the barcode is horizontal</li>
            </ul>
            <p className="text-xs italic">Supports: UPC, EAN, QR Code, Code 128, and more</p>
          </div>
        </div>
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
