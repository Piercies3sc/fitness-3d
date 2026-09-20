'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

interface AvatarCropModalProps {
  imageSrc: string;
  onApply: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export function AvatarCropModal({ imageSrc, onApply, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onApply(croppedBlob);
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
    >
      <div className="relative flex w-full max-w-sm flex-col border border-border-strong bg-surface p-5 shadow-2xl sm:p-6">
        <div className="mb-4">
          <p className="page-eyebrow mb-1">Fotoğraf Düzenleme</p>
          <h2 id="crop-dialog-title" className="text-lg font-semibold tracking-[-0.04em] text-text-primary">
            Fotoğrafı Kırp
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            Fotoğrafı sürükleyerek ve yakınlaştırarak avatar alanına hizalayın.
          </p>
        </div>

        {/* Crop Container with Circular Preview */}
        <div className="relative h-64 w-full overflow-hidden rounded bg-black/90 sm:h-72">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom Slider */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[11px] font-medium text-text-muted">Yakınlaştır</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded bg-surface-high accent-accent"
            aria-label="Yakınlaştırma"
          />
          <span className="font-mono text-xs text-text-secondary">{zoom.toFixed(1)}x</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-2 border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="button-secondary min-h-10 px-4 text-xs cursor-pointer disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing || !croppedAreaPixels}
            className="button-primary min-h-10 px-5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? 'İşleniyor...' : 'Uygula'}
          </button>
        </div>
      </div>
    </div>
  );
}
