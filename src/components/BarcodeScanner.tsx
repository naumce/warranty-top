import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode, Html5QrcodeSupportedFormats, type Html5QrcodeCamera } from "html5-qrcode";
import { Flashlight, Pause, Play, RefreshCw, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (text: string, formatName?: string) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "enhanced-barcode-scanner";
const LAST_CAMERA_KEY = "warranty:lastCameraId";

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<Html5QrcodeCamera[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState<boolean | null>(null);
  const lastResultRef = useRef<{ text: string; at: number } | null>(null);

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

  useEffect(() => {
    let mounted = true;
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        setCameras(devices);
        const saved = localStorage.getItem(LAST_CAMERA_KEY) || undefined;
        const initial = devices.find((d) => d.id === saved)?.id || devices[0]?.id;
        setActiveCameraId(initial);
      })
      .catch(() => {
        setCameras([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stop = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } finally {
        scannerRef.current = null;
      }
    }
    setIsRunning(false);
  };

  const start = async (cameraId: string | undefined) => {
    if (!cameraId) return;
    await stop();
    const html5 = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = html5;

    // Dynamic ROI sized for linear codes
    const qrbox = (viewWidth: number, viewHeight: number) => {
      const width = Math.min(480, Math.floor(viewWidth * 0.9));
      const height = Math.max(140, Math.floor(width / 2.8));
      return { width, height } as const;
    };

    await html5.start(
      { deviceId: { exact: cameraId } },
      {
        fps: 24,
        qrbox,
        aspectRatio: 2.4,
        disableFlip: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        } as any,
        formatsToSupport: formats,
      },
      (decodedText, result) => {
        const now = Date.now();
        const last = lastResultRef.current;
        if (last && last.text === decodedText && now - last.at < 1500) return;
        lastResultRef.current = { text: decodedText, at: now };

        const formatName = (result as any)?.result?.format?.formatName;
        onScan(decodedText, formatName);
        void stop();
      },
      () => {}
    );

    // Torch capability probe (best-effort)
    try {
      // @ts-expect-error private access: getState is not public, best-effort check
      const stream: MediaStream | undefined = (scannerRef.current as any)?._localMediaStream;
      const track = stream?.getVideoTracks?.()[0];
      const capabilities = track?.getCapabilities?.();
      setTorchAvailable(Boolean(capabilities && "torch" in capabilities));
    } catch {
      setTorchAvailable(null);
    }

    setIsRunning(true);
  };

  useEffect(() => {
    if (activeCameraId) {
      localStorage.setItem(LAST_CAMERA_KEY, activeCameraId);
      void start(activeCameraId);
    }
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCameraId]);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      // @ts-expect-error private access: getState is not public, best-effort apply
      const stream: MediaStream | undefined = (scannerRef.current as any)?._localMediaStream;
      const track = stream?.getVideoTracks?.[0];
      if (!track) return;
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] as any });
      setTorchOn((v) => !v);
    } catch {
      setTorchAvailable(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Scan Barcode/QR</span>
          {cameras.length > 1 && (
            <select
              className="ml-2 text-sm border rounded px-2 py-1"
              value={activeCameraId}
              onChange={(e) => setActiveCameraId(e.target.value)}
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>{c.label || "Camera"}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {torchAvailable && (
            <Button variant="outline" size="icon" onClick={toggleTorch} title="Toggle flashlight">
              <Flashlight className="h-4 w-4" />
            </Button>
          )}
          {isRunning ? (
            <Button variant="outline" size="icon" onClick={() => void stop()} title="Pause">
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" onClick={() => void start(activeCameraId)} title="Resume">
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => setActiveCameraId((id) => id)} title="Restart">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { void stop(); onClose(); }}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div id={SCANNER_ELEMENT_ID} className="w-full rounded-lg overflow-hidden" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="border-2 border-green-500/70 rounded-md" style={{ width: "90%", height: 150 }}></div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Keep barcode inside the box. Good light. Hold steady.</p>
        <p>Supports UPC/EAN/Code128/Code39/ITF/QR/PDF417/etc.</p>
      </div>
    </div>
  );
}

export default BarcodeScanner;


