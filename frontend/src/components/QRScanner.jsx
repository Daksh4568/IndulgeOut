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
      console.log(`✅ QR Code scanned: ${decodedText}`);
      
      // Prevent duplicate scans (same data within 2 seconds)
      if (lastScannedData === decodedText) {
        console.log('⚠️ Duplicate scan detected, ignoring...');
        return;
      }
      
      setLastScannedData(decodedText);
      
      // Parse QR data (expected to be JSON from ticket)
      try {
        let ticketData;
        try {
          ticketData = JSON.parse(decodedText);
        } catch {
          // If not JSON, assume it's just the ticket number
          ticketData = { ticketNumber: decodedText };
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
  }, [isScanning, onScanSuccess, onScanError, lastScannedData]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-lg mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close scanner"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Scanner Instructions */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Camera className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Ticket QR Code
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Position the QR code within the frame to scan
          </p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white dark:bg-gray-800 p-4">
          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="w-full rounded-lg overflow-hidden"
          />
        </div>

        {/* Scanner Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-b-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            {scannerReady ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Camera ready - Point at QR code</span>
              </>
            ) : (
              <>
                <Loader className="h-4 w-4 animate-spin text-indigo-600" />
                <span>Initializing camera...</span>
              </>
            )}
          </div>
        </div>

        {/* Manual Entry Fallback */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Having trouble? Use manual ticket number entry
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
