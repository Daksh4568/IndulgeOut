import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, CheckCircle, Loader, Zap, ZapOff, RefreshCw, AlertTriangle } from 'lucide-react';

/**
 * QR Scanner Component — fully custom UI using Html5Qrcode (low-level API)
 * Optimized for fast scanning on iOS Safari and Android mobile devices.
 *
 * Key optimisations:
 *  - formatsToSupport: QR_CODE only (constructor, not scan config)
 *  - useBarCodeDetectorIfSupported: true → native HW decoder on iOS 17.2+/Chrome 83+
 *  - 30 fps, disableFlip, no forced aspectRatio
 *  - Higher-resolution camera request (1280×720 ideal)
 *  - Callback refs to break React dependency chains and prevent re-init loops
 */
const QRScanner = ({ onScanSuccess, onScanError, onClose, isScanning = true }) => {
  const html5QrRef = useRef(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [scanSlow, setScanSlow] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const lastScannedRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);
  const slowTimerRef = useRef(null);

  // ── Stable callback refs (prevents useEffect dependency chains) ──────
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  });

  // ── Slow-scan timer helpers ──────────────────────────────────────────
  const clearSlowTimer = useCallback(() => {
    if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
  }, []);

  const startSlowTimer = useCallback(() => {
    clearSlowTimer();
    slowTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setScanSlow(true);
    }, 12000);
  }, [clearSlowTimer]);

  // ── Decode success handler ───────────────────────────────────────────
  const handleSuccess = useCallback((decodedText) => {
    if (!decodedText || typeof decodedText !== 'string') return;
    const text = decodedText.trim();
    if (!text) return;

    const now = Date.now();
    if (text === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) return;
    lastScannedRef.current = text;
    lastScannedTimeRef.current = now;

    clearSlowTimer();
    setScanSlow(false);

    if (navigator.vibrate) navigator.vibrate(100);

    let ticketData;
    try {
      ticketData = JSON.parse(text);
    } catch {
      ticketData = { ticketNumber: text };
    }

    if (!ticketData?.ticketNumber) {
      onScanErrorRef.current?.('Invalid ticket QR code');
      lastScannedRef.current = null;
      return;
    }

    onScanSuccessRef.current(ticketData);
  }, [clearSlowTimer]);

  // ── Stop scanner safely ──────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    const inst = html5QrRef.current;
    if (!inst) return;
    try {
      const state = inst.getState?.();
      if (state === 2 || state === 3) await inst.stop();
    } catch {}
  }, []);

  // ── Start scanner with camera deviceId ───────────────────────────────
  const startWithCamera = useCallback(async (deviceId) => {
    const inst = html5QrRef.current;
    if (!inst || !mountedRef.current || startingRef.current) return;
    startingRef.current = true;

    // Scan config — fps high, QR-only, no flip, no forced aspect ratio
    const scanCfg = {
      fps: 30,
      qrbox: (vw, vh) => {
        const size = Math.floor(Math.min(vw, vh) * 0.65);
        return { width: Math.max(50, size), height: Math.max(50, size) };
      },
      disableFlip: true,
    };

    // html5-qrcode requires EXACTLY 1 key when passing an object as first arg.
    // Pass deviceId as plain string; use facingMode object for fallback.

    const onStarted = () => {
      if (!mountedRef.current) { inst.stop().catch(() => {}); return; }
      setScannerReady(true);
      setCameraError('');
      setTorchOn(false);
      setTorchSupported(false);
      setScanSlow(false);
      startSlowTimer();

      // Request higher resolution after camera starts (best-effort)
      try {
        const videoElem = document.querySelector('#qr-reader-live video');
        const track = videoElem?.srcObject?.getVideoTracks?.()?.[0];
        if (track) {
          track.applyConstraints({
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          }).catch(() => {});
        }
      } catch {}

      try {
        const capabilities = inst.getRunningTrackCameraCapabilities?.();
        if (capabilities?.torchFeature?.()?.isSupported?.()) setTorchSupported(true);
      } catch {}
    };

    try {
      await inst.start(deviceId, scanCfg, handleSuccess, () => {});
      onStarted();
    } catch (err) {
      console.error('Camera start error:', err);
      // Fallback: facingMode instead of deviceId
      try {
        await inst.start({ facingMode: 'environment' }, scanCfg, handleSuccess, () => {});
        onStarted();
      } catch (err2) {
        console.error('Fallback camera error:', err2);
        if (mountedRef.current) {
          setCameraError('Failed to start camera. Please check camera permissions and try again.');
        }
      }
    } finally {
      startingRef.current = false;
    }
  }, [handleSuccess, startSlowTimer]);

  // ── Initialise on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!isScanning) return;
    mountedRef.current = true;

    const containerId = 'qr-reader-live';

    const init = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        if (!devices || devices.length === 0) {
          setCameraError('No cameras found on this device.');
          return;
        }

        setCameras(devices);

        // Prefer back / environment camera
        let backIdx = devices.findIndex(d => {
          const label = (d.label || '').toLowerCase();
          return label.includes('back') || label.includes('rear') || label.includes('environment');
        });
        if (backIdx === -1) backIdx = devices.length > 1 ? devices.length - 1 : 0;
        setActiveCameraIdx(backIdx);

        // Constructor: QR-only format + native BarcodeDetector when available
        const html5Qr = new Html5Qrcode(containerId, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
        html5QrRef.current = html5Qr;

        await startWithCamera(devices[backIdx].id);
      } catch (err) {
        console.error('Scanner init error:', err);
        if (mountedRef.current) {
          setCameraError('Failed to initialize camera. Please check permissions and reload.');
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      clearSlowTimer();
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
  }, [isScanning, startWithCamera, clearSlowTimer]);

  // ── Flip camera ──────────────────────────────────────────────────────
  const flipCamera = async () => {
    if (cameras.length < 2 || !html5QrRef.current) return;
    const nextIdx = (activeCameraIdx + 1) % cameras.length;
    setActiveCameraIdx(nextIdx);
    setScannerReady(false);
    setScanSlow(false);
    clearSlowTimer();
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

        {/* Slow-scan help banner */}
        {scanSlow && scannerReady && (
          <div className="absolute bottom-4 left-4 right-4 bg-yellow-900/90 backdrop-blur-sm rounded-xl p-3 pointer-events-none z-10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 text-sm font-medium mb-1">Having trouble scanning?</p>
                <ul className="text-yellow-300/80 text-xs space-y-0.5">
                  <li>• Increase screen brightness on the ticket phone</li>
                  <li>• Hold steady at 15–30 cm distance</li>
                  <li>• Avoid direct light / glare on the screen</li>
                  <li>• Close scanner &amp; enter ticket number manually</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Camera error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-6 z-10">
            <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-white text-sm font-medium text-center mb-4">{cameraError}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Close &amp; Enter Manually
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {!scannerReady && !cameraError && (
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
          {cameraError ? (
            <>
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-400 text-xs font-medium">Camera error — enter ticket manually</span>
            </>
          ) : scannerReady ? (
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
