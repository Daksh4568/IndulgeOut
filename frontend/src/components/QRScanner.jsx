import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, Loader, Zap, ZapOff, RefreshCw } from 'lucide-react';

/**
 * QR Scanner Component — fully custom UI using Html5Qrcode (low-level API)
 * Optimized for iOS Safari and Android mobile devices
 */
const QRScanner = ({ onScanSuccess, onScanError, onClose, isScanning = true }) => {
  const html5QrRef = useRef(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const lastScannedRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);

  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const handleSuccess = useCallback((decodedText) => {
    if (!decodedText || typeof decodedText !== 'string') return;
    const text = decodedText.trim();
    if (!text) return;

    const now = Date.now();
    if (text === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) return;
    lastScannedRef.current = text;
    lastScannedTimeRef.current = now;

    if (navigator.vibrate) navigator.vibrate(100);

    let ticketData;
    try {
      ticketData = JSON.parse(text);
    } catch {
      ticketData = { ticketNumber: text };
    }

    if (!ticketData?.ticketNumber) {
      onScanError?.('Invalid ticket QR code');
      lastScannedRef.current = null;
      return;
    }

    onScanSuccess(ticketData);
  }, [onScanSuccess, onScanError]);

  const scanConfig = useMemo(() => ({
    fps: isIOS ? 15 : 20,
    qrbox: (vw, vh) => {
      const edge = Math.min(vw, vh);
      if (edge < 100) return { width: 100, height: 100 };
      const size = Math.floor(edge * 0.7);
      return { width: size, height: size };
    },
    aspectRatio: 1.0,
    disableFlip: false,
    formatsToSupport: [0],
  }), [isIOS]);

  // Stop the running scanner instance safely
  const stopScanner = useCallback(async () => {
    const inst = html5QrRef.current;
    if (!inst) return;
    try {
      const state = inst.getState?.();
      if (state === 2 || state === 3) {
        await inst.stop();
      }
    } catch {}
  }, []);

  // Start scanner with a specific camera device ID
  const startWithCamera = useCallback(async (deviceId) => {
    const inst = html5QrRef.current;
    if (!inst || !mountedRef.current || startingRef.current) return;
    startingRef.current = true;

    try {
      await inst.start(
        { deviceId: { exact: deviceId } },
        scanConfig,
        handleSuccess,
        () => {}
      );

      if (!mountedRef.current) { inst.stop().catch(() => {}); return; }

      setScannerReady(true);
      setTorchOn(false);
      setTorchSupported(false);

      try {
        const capabilities = inst.getRunningTrackCameraCapabilities?.();
        if (capabilities?.torchFeature?.()?.isSupported?.()) {
          setTorchSupported(true);
        }
      } catch {}
    } catch (err) {
      console.error('Camera start error:', err);
      // If deviceId fails, try facingMode fallback
      try {
        await inst.start(
          { facingMode: 'environment' },
          scanConfig,
          handleSuccess,
          () => {}
        );
        if (mountedRef.current) setScannerReady(true);
      } catch (err2) {
        console.error('Fallback camera error:', err2);
        if (mountedRef.current) onScanError?.('Failed to start camera. Check permissions.');
      }
    } finally {
      startingRef.current = false;
    }
  }, [scanConfig, handleSuccess, onScanError]);

  // Initial setup: enumerate cameras, pick back camera, start
  useEffect(() => {
    if (!isScanning) return;
    mountedRef.current = true;

    const containerId = 'qr-reader-live';

    const init = async () => {
      try {
        // Enumerate available cameras
        const devices = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        if (!devices || devices.length === 0) {
          onScanError?.('No cameras found on this device.');
          return;
        }

        setCameras(devices);

        // Pick the back/environment camera by default
        let backIdx = devices.findIndex(d => {
          const label = (d.label || '').toLowerCase();
          return label.includes('back') || label.includes('rear') || label.includes('environment');
        });
        if (backIdx === -1) backIdx = devices.length > 1 ? devices.length - 1 : 0;

        setActiveCameraIdx(backIdx);

        // Create scanner instance
        const html5Qr = new Html5Qrcode(containerId, { verbose: false });
        html5QrRef.current = html5Qr;

        await startWithCamera(devices[backIdx].id);
      } catch (err) {
        console.error('Scanner init error:', err);
        if (mountedRef.current) onScanError?.('Failed to start camera. Check permissions.');
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      const inst = html5QrRef.current;
      html5QrRef.current = null;
      if (inst) {
        const state = inst.getState?.();
        if (state === 2 || state === 3) {
          inst.stop().then(() => { try { inst.clear(); } catch {} }).catch(() => {});
        } else {
          try { inst.clear(); } catch {}
        }
      }
      setScannerReady(false);
      setTorchOn(false);
      setTorchSupported(false);
    };
  }, [isScanning, onScanError, startWithCamera]);

  // Flip camera
  const flipCamera = async () => {
    if (cameras.length < 2 || !html5QrRef.current) return;
    const nextIdx = (activeCameraIdx + 1) % cameras.length;
    setActiveCameraIdx(nextIdx);
    setScannerReady(false);
    await stopScanner();
    await startWithCamera(cameras[nextIdx].id);
  };

  const toggleTorch = async () => {
    try {
      const caps = html5QrRef.current?.getRunningTrackCameraCapabilities?.();
      const torch = caps?.torchFeature?.();
      if (torch) {
        const next = !torchOn;
        await (next ? torch.enable() : torch.disable());
        setTorchOn(next);
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-black/80 backdrop-blur-sm safe-area-top">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Scan Ticket</h3>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={flipCamera}
              className="p-2 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
              aria-label="Switch camera"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          )}
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full transition-colors ${torchOn ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-300'}`}
              aria-label="Toggle flashlight"
            >
              {torchOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <div id="qr-reader-live" className="w-full h-full" />

        {scannerReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ width: '65%', aspectRatio: '1' }}>
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos, i) => (
                <div key={i} className={`absolute w-8 h-8 border-purple-400 ${pos} rounded-sm`} />
              ))}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan-line" />
            </div>
          </div>
        )}

        {!scannerReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <Loader className="h-8 w-8 animate-spin text-purple-400 mb-3" />
            <p className="text-white text-sm font-medium">Starting camera...</p>
            <p className="text-gray-400 text-xs mt-1">Allow camera access if prompted</p>
          </div>
        )}
      </div>

      {/* Bottom tips */}
      <div className="px-4 py-3 bg-black/80 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-center gap-2 mb-2">
          {scannerReady ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-xs font-medium">Camera ready — point at QR code</span>
            </>
          ) : (
            <>
              <Loader className="h-4 w-4 animate-spin text-purple-400" />
              <span className="text-gray-300 text-xs">Initializing camera...</span>
            </>
          )}
        </div>
        <div className="flex justify-center gap-4 text-[11px] text-gray-400">
          <span>📏 15–30 cm</span>
          <span>🔆 Max brightness</span>
          <span>📱 Hold steady</span>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scanLine 2s ease-in-out infinite;
          position: absolute;
        }
        .safe-area-top { padding-top: max(0.75rem, env(safe-area-inset-top)); }
        .safe-area-bottom { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
        #qr-reader-live img, #qr-reader-live video { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 0 !important; }
        #qr-reader-live #qr-shaded-region { border: none !important; }
        #qr-reader-live div[style*="border-width"] { border: none !important; }
      `}</style>
    </div>
  );
};

export default QRScanner;
