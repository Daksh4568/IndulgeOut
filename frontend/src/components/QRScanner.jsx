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

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        disableFlip: false,
        videoConstraints: {
          facingMode: { ideal: "environment" }, // Use back camera on mobile
          advanced: [{ zoom: 1.5 }]
        }
      },
      false
    );

    // Success callback
    const onScanSuccessCallback = (decodedText, decodedResult) => {
      // Validate decoded text
      if (!decodedText || typeof decodedText !== 'string') {
        console.error('❌ Invalid QR scan data:', decodedText);
        onScanError?.('Invalid QR code data');
        return;
      }

      const decodedString = String(decodedText).trim();
      if (!decodedString) {
        console.error('❌ Empty QR scan data');
        onScanError?.('Empty QR code');
        return;
      }

      console.log(`✅ QR Code scanned: ${decodedString}`);
      
      // Prevent duplicate scans (same data within 2 seconds)
      if (lastScannedData === decodedString) {
        console.log('⚠️ Duplicate scan detected, ignoring...');
        return;
      }
      
      setLastScannedData(decodedString);
      
      // Parse QR data (expected to be JSON from ticket)
      try {
        let ticketData;
        try {
          ticketData = JSON.parse(decodedString);
        } catch {
          // If not JSON, assume it's just the ticket number
          ticketData = { ticketNumber: decodedString };
        }
        
        onScanSuccess(ticketData);
        
        // Clear last scanned data after 3 seconds to allow rescanning
        setTimeout(() => setLastScannedData(null), 3000);
      } catch (error) {
        console.error('❌ Error parsing QR data:', error);
        onScanError?.('Invalid QR code format');
      }
    };

    // Error callback
    const onScanErrorCallback = (errorMessage) => {
      // Suppress common scanning errors (these are expected during scanning)
      if (!errorMessage.includes('No MultiFormat Readers')) {
        // console.log('Scanning...', errorMessage);
      }
    };

    // Start scanning
    html5QrcodeScanner.render(onScanSuccessCallback, onScanErrorCallback);
    setScanner(html5QrcodeScanner);
    setScannerReady(true);

    // Cleanup
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error('❌ Error stopping scanner:', error);
      });
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
          <p className="text-xs sm:text-sm text-gray-400">
            Position the QR code within the frame
          </p>
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
