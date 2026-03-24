import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Check } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.width * cos + image.height * sin;
  const rotatedHeight = image.width * sin + image.height * cos;

  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;

  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
}

const ImageCropper = ({ file, onComplete, onCancel, aspectRatio, circular = false }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Load image from file
  React.useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result);
    reader.readAsDataURL(file);
  }, [file]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
    onComplete(croppedBlob);
  };

  if (!imageSrc) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
        <div className="text-white">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D] border-b border-white/10">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="text-sm">Cancel</span>
        </button>
        <h3 className="text-white text-sm font-semibold">Edit Image</h3>
        <button
          onClick={handleDone}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ background: 'linear-gradient(180deg, #7878E9 11%, #3D3DD4 146%)' }}
        >
          <Check className="h-4 w-4" />
          <span>Apply</span>
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspectRatio || undefined}
          cropShape={circular ? 'round' : 'rect'}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-[#0D0D0D] border-t border-white/10 px-4 py-4 space-y-4">
        {/* Rotate Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setRotation((r) => r - 90)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">Rotate Left</span>
          </button>
          <button
            onClick={() => setRotation(0)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setRotation((r) => r + 90)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-xs">Rotate Right</span>
          </button>
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <ZoomOut className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #7878E9 ${((zoom - 1) / 2) * 100}%, #333 ${((zoom - 1) / 2) * 100}%)`,
            }}
          />
          <ZoomIn className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
