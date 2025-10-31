import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Flashlight, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (text: string, formatName?: string) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "enhanced-barcode-scanner";

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastResultRef = useRef<{ text: string; at: number } | null>(null);
  const scanCountRef = useRef(0);

  const formats = useMemo(() => [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.PDF_417,
    Html5QrcodeSupportedFormats.AZTEC,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
  ], []);

  const stop = async () => {
    if (scannerRef.current) {
      try {
        const state = await scannerRef.current.getState();
        if (state === 2) { // Scanning state
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      } finally {
        scannerRef.current = null;
      }
    }
  };

  const start = async () => {
    await stop();
    setError(null);
    scanCountRef.current = 0;

    try {
      const html5 = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = html5;

      // Mobile-first: larger scan area, optimized for barcodes
      const qrbox = (viewWidth: number, viewHeight: number) => {
        // Use 85% width on mobile, larger height for barcodes
        const width = Math.min(viewWidth * 0.85, 600);
        const height = Math.max(200, Math.min(viewHeight * 0.4, 300));
        return { width, height } as const;
      };

      // Try back camera first (environment), fallback to any available
      await html5.start(
        { facingMode: "environment" },
        {
          fps: 30,
          qrbox,
          aspectRatio: 1.777778,
          disableFlip: false,
        },
        (decodedText, result) => {
          scanCountRef.current++;
          const now = Date.now();
          const last = lastResultRef.current;
          
          // Reduced debounce: only 500ms to prevent duplicate scans
          if (last && last.text === decodedText && now - last.at < 500) {
            return;
          }
          lastResultRef.current = { text: decodedText, at: now };

          const formatName = (result as any)?.result?.format?.formatName;
          
          // Fire callback immediately
          try {
            onScan(decodedText, formatName);
            void stop();
          } catch (err) {
            console.error("Error in onScan callback:", err);
          }
        },
        (errorMessage) => {
          // Only log errors, don't spam UI
          // Errors are normal during scanning
          scanCountRef.current++;
        }
      );

      // Check for torch after a delay (camera needs to initialize)
      setTimeout(() => {
        try {
          const stream: MediaStream | undefined = (scannerRef.current as any)?._localMediaStream;
          const track = stream?.getVideoTracks?.()[0];
          const capabilities = track?.getCapabilities?.();
          setTorchAvailable(Boolean(capabilities && "torch" in capabilities));
        } catch {
          setTorchAvailable(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error("Scanner error:", err);
      setError(err?.message || "Failed to start camera");
    }
  };

  useEffect(() => {
    void start();
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const stream: MediaStream | undefined = (scannerRef.current as any)?._localMediaStream;
      const track = stream?.getVideoTracks?.[0];
      if (!track) return;
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] as any });
      setTorchOn((v) => !v);
    } catch (err) {
      console.error("Torch error:", err);
      setTorchAvailable(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Fullscreen scanner */}
      <div className="absolute inset-0">
        <div 
          id={SCANNER_ELEMENT_ID} 
          className="w-full h-full bg-black"
        />
      </div>

      {/* Floating close button - top right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {torchAvailable && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTorch}
            className="text-white hover:bg-white/20 bg-black/50"
            title="Flashlight"
          >
            <Flashlight className={`h-5 w-5 ${torchOn ? "fill-current" : ""}`} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            void stop();
            onClose();
          }}
          className="text-white hover:bg-white/20 bg-black/50"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Floating instructions - bottom */}
      <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-center">
          <p className="text-white text-sm font-medium">Point camera at barcode</p>
          <p className="text-white/70 text-xs mt-1">Keep steady within the frame</p>
        </div>
      </div>

      {error && (
        <div className="absolute bottom-20 left-4 right-4 z-10 bg-red-500/90 text-white p-3 rounded-lg text-sm">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void start()}
            className="mt-2 text-white hover:bg-white/20"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export default BarcodeScanner;
