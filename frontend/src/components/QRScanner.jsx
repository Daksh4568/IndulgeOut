import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * QR Scanner Component
 * Uses html5-qrcode library to scan QR codes from tickets
 */
const QRScanner = ({ onScanSuccess, onScanError, onClose, isScanning = true }) => {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [lastScannedData, setLastScannedData] = useState(null);

  useEffect(() => {
    if (!isScanning) return;

    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(navigator.userAgent);

    // Initialize scanner optimized for both printed and screen QR codes
    const scannerConfig = {
      fps: isIOS ? 30 : 25, // Higher FPS for iOS for faster detection
      qrbox: function(viewfinderWidth, viewfinderHeight) {
        // Dynamic QR box sizing - optimized for various distances
        // iOS needs larger detection area for better results
        const minEdgePercentage = isIOS ? 0.75 : 0.65;
        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
        return {
          width: qrboxSize,
          height: qrboxSize
        };
      },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true, // Flashlight for low light
      showZoomSliderIfSupported: !isIOS, // Zoom not supported on iOS Safari
      defaultZoomValueIfSupported: 2, // Default zoom for Android
      disableFlip: false, // Allow horizontal flip
      rememberLastUsedCamera: true,
      // Don't restrict format - let library detect any QR/barcode format
      formatsToSupport: undefined,
      // Enhanced settings for screen scanning
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: !isIOS // Disable for iOS, use standard detector
      },
      verbose: false // Disable verbose logging in production
    };

    // Platform-specific video constraints
    if (isIOS) {
      // iOS Safari constraints - optimized for faster processing
      scannerConfig.videoConstraints = {
        facingMode: { exact: "environment" }, // Force back camera
        // Lower resolution for faster processing on iOS
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        // Higher frame rate for smoother scanning
        frameRate: { ideal: 60, max: 60 },
        // iOS-specific optimizations
        focusMode: "continuous",
        exposureMode: "continuous"
      };
    } else if (isAndroid) {
      // Android-optimized constraints with advanced features
      scannerConfig.videoConstraints = {
        facingMode: { exact: "environment" }, // Prefer back camera
        // High resolution for screen-to-screen scanning
        width: { min: 640, ideal: 1920, max: 3840 },
        height: { min: 480, ideal: 1080, max: 2160 },
        frameRate: { ideal: 30, max: 60 },
        // Android-specific optimizations
        focusMode: "continuous",
        exposureMode: "continuous",
        whiteBalanceMode: "continuous"
      };
    } else {
      // Fallback for other browsers (desktop, etc.)
      scannerConfig.videoConstraints = {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      };
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      scannerConfig,
      false // verbose
    );

    // Success callback
    const onScanSuccessCallback = (decodedText, decodedResult) => {
      try {
        // Robust validation for cross-platform compatibility
        if (decodedText === null || decodedText === undefined) {
          console.error('❌ Null/undefined QR scan data');
          return; // Don't show error, just skip
        }

        // Convert to string safely (handle platform quirks)
        let decodedString;
        if (typeof decodedText === 'string') {
          decodedString = decodedText.trim();
        } else if (typeof decodedText === 'object' && decodedText !== null) {
          // Some platforms might return an object
          decodedString = JSON.stringify(decodedText);
        } else if (typeof decodedText === 'number') {
          // Handle numeric QR codes
          decodedString = String(decodedText);
        } else {
          // Fallback: try to convert to string
          try {
            decodedString = String(decodedText).trim();
          } catch (err) {
            console.error('❌ Cannot convert QR data to string:', err);
            return;
          }
        }

        if (!decodedString || decodedString.length === 0) {
          console.error('❌ Empty QR scan data');
          return;
        }

        console.log(`✅ QR Code detected: ${decodedString.substring(0, 50)}...`);
        
        // Prevent duplicate scans (same data within 2 seconds)
        if (lastScannedData === decodedString) {
          console.log('⚠️ Duplicate scan detected, ignoring...');
          return;
        }
        
        setLastScannedData(decodedString);
        
        // Parse QR data (expected to be JSON from ticket)
        let ticketData;
        try {
          // Try parsing as JSON first
          ticketData = JSON.parse(decodedString);
        } catch {
          // If not JSON, treat as plain ticket number
          ticketData = { ticketNumber: decodedString };
        }
        
        // Validate ticket data has required field
        if (!ticketData || !ticketData.ticketNumber) {
          console.error('❌ Invalid ticket data structure');
          onScanError?.('Invalid ticket QR code');
          setLastScannedData(null);
          return;
        }
        
        console.log('✅ Valid ticket scanned:', ticketData.ticketNumber);
        onScanSuccess(ticketData);
        
        // Clear last scanned data after 3 seconds to allow rescanning
        setTimeout(() => setLastScannedData(null), 3000);
      } catch (error) {
        console.error('❌ Error in scan success callback:', error);
        onScanError?.('Error processing QR code');
        setLastScannedData(null);
      }
    };

    // Error callback - suppress expected scanning errors
    const onScanErrorCallback = (errorMessage) => {
      // These errors are expected during normal scanning operation
      const suppressedErrors = [
        'No MultiFormat Readers',
        'NotFoundException', // No QR code in frame
        'NotFoundError', // Camera not found
        'NotAllowedError', // Permission issues
        'NotReadableError', // Camera busy
        'OverconstrainedError', // Constraints not supported
        'AbortError', // User cancelled
        'QR code parse error', // Parse failures during scan
        'No QR code found' // Detection failures
      ];
      
      // Check if this is a suppressed error
      const shouldSuppress = suppressedErrors.some(err => {
        if (typeof errorMessage === 'string') {
          return errorMessage.includes(err);
        } else if (typeof errorMessage === 'object' && errorMessage?.message) {
          return errorMessage.message.includes(err);
        }
        return false;
      });
      
      // Only log non-suppressed errors (potential issues)
      if (!shouldSuppress && errorMessage) {
        console.log('📷 Scanner info:', 
          typeof errorMessage === 'string' ? errorMessage : errorMessage?.message || 'Unknown'
        );
      }
    };

    // Start scanning with error handling for iOS
    try {
      html5QrcodeScanner.render(onScanSuccessCallback, onScanErrorCallback);
      setScanner(html5QrcodeScanner);
      setScannerReady(true);
    } catch (error) {
      console.error('❌ Error initializing scanner:', error);
      onScanError?.('Failed to initialize camera. Please check permissions.');
    }

    // Cleanup - Important for iOS Safari
    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
          // iOS Safari sometimes throws errors during cleanup, ignore them
          console.log('Scanner cleanup:', error.message || error);
        });
      }
    };
  }, [isScanning, onScanSuccess, onScanError]); // Removed lastScannedData to prevent reinitializations

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-sm sm:max-w-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 transition-colors z-10 p-2"
          aria-label="Close scanner"
        >
          <X className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        {/* Scanner Instructions */}
        <div className="bg-gray-900 rounded-t-lg p-3 sm:p-4 text-center border-b border-gray-800">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Scan Ticket QR Code
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mb-2">
            Position the QR code within the scanning frame
          </p>
          {/* Scanning tips for better success rate */}
          <div className="text-[10px] sm:text-xs text-gray-500 space-y-1 bg-gray-800 bg-opacity-50 rounded-lg p-2">
            <p>💡 <strong>Digital tickets:</strong> Max brightness, avoid glare</p>
            <p>📏 <strong>Distance:</strong> Hold 15-30cm (6-12 inches) away</p>
            <p>📱 <strong>Stability:</strong> Keep both devices steady 2-3 seconds</p>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="bg-gray-900 p-2 sm:p-4">
          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden min-h-[280px] sm:min-h-[320px]"
          />
        </div>

        {/* Scanner Footer */}
        <div className="bg-gray-900 rounded-b-lg p-3 sm:p-4 text-center border-t border-gray-800">
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-400">
            {scannerReady ? (
              <>
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Camera ready</span>
              </>
            ) : (
              <>
                <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-purple-500" />
                <span>Initializing...</span>
              </>
            )}
          </div>
        </div>

        {/* Manual Entry Fallback */}
        <div className="mt-3 sm:mt-4 text-center px-4">
          <p className="text-xs sm:text-sm text-gray-400">
            Having trouble? Use manual entry below
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
