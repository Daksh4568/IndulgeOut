import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, Loader, Zap, ZapOff } from 'lucide-react';

/**
 * QR Scanner Component — fully custom UI using Html5Qrcode (low-level API)
 * Optimized for iOS Safari and Android mobile devices
 */
const QRScanner = ({ onScanSuccess, onScanError, onClose, isScanning = true }) => {
  const html5QrRef = useRef(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const lastScannedRef = useRef(null);
  const lastScannedTimeRef = useRef(0);

  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const handleSuccess = useCallback((decodedText) => {
    if (!decodedText || typeof decodedText !== 'string') return;
    const text = decodedText.trim();
    if (!text) return;

    // Deduplicate within 3 seconds
    const now = Date.now();
    if (text === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) return;
    lastScannedRef.current = text;
    lastScannedTimeRef.current = now;

    // Vibrate on successful scan (mobile feedback)
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

  useEffect(() => {
    if (!isScanning) return;

    const containerId = 'qr-reader-live';
    let html5Qr;
    let mounted = true;

    const startScanner = async () => {
      try {
        html5Qr = new Html5Qrcode(containerId, { verbose: false });
        html5QrRef.current = html5Qr;

        // Camera config — must have exactly 1 key: facingMode or deviceId
        const cameraConfig = { facingMode: 'environment' };

        const scanConfig = {
          fps: isIOS ? 15 : 20,
          qrbox: (vw, vh) => {
            const edge = Math.min(vw, vh);
            const size = Math.floor(edge * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
          disableFlip: false,
          formatsToSupport: [0], // QR_CODE only for faster detection
          videoConstraints: isIOS
            ? { width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        };

        await html5Qr.start(
          cameraConfig,
          scanConfig,
          handleSuccess,
          () => {} // Suppress scan-miss errors
        );

        if (!mounted) {
          await html5Qr.stop().catch(() => {});
          return;
        }

        setScannerReady(true);

        // Check torch support
        try {
          const capabilities = html5Qr.getRunningTrackCameraCapabilities?.();
          if (capabilities?.torchFeature?.()?.isSupported?.()) {
            setTorchSupported(true);
          }
        } catch {
          // Torch check not critical
        }
      } catch (err) {
        console.error('Scanner init error:', err);
        if (mounted) onScanError?.('Failed to start camera. Check permissions.');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
        html5QrRef.current.clear().catch(() => {});
        html5QrRef.current = null;
      }
      setScannerReady(false);
      setTorchOn(false);
      setTorchSupported(false);
    };
  }, [isScanning, handleSuccess, onScanError, isIOS]);

  const toggleTorch = async () => {
    try {
      const caps = html5QrRef.current?.getRunningTrackCameraCapabilities?.();
      const torch = caps?.torchFeature?.();
      if (torch) {
        const next = !torchOn;
        await (next ? torch.enable() : torch.disable());
        setTorchOn(next);
      }
    } catch {
      // Torch toggle not critical
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-black/80 backdrop-blur-sm safe-area-top">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Scan Ticket</h3>
        </div>
        <div className="flex items-center gap-3">
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

        {/* Scanning overlay — corner brackets */}
        {scannerReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ width: '65%', aspectRatio: '1' }}>
              {/* Corner brackets */}
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos, i) => (
                <div key={i} className={`absolute w-8 h-8 border-purple-400 ${pos} rounded-sm`} />
              ))}
              {/* Scanning line animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-scan-line" />
            </div>
          </div>
        )}

        {/* Loading state */}
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

      {/* Inline keyframe animation for scanning line */}
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
        /* Hide html5-qrcode library default UI elements */
        #qr-reader-live img, #qr-reader-live video { width: 100% !important; height: 100% !important; object-fit: cover !important; border-radius: 0 !important; }
        #qr-reader-live #qr-shaded-region { border: none !important; }
        #qr-reader-live div[style*="border-width"] { border: none !important; }
      `}</style>
    </div>
  );
};

export default QRScanner;
