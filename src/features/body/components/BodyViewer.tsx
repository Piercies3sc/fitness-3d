'use client';

import React, { Suspense, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AnatomyModel, DisplayBounds } from './AnatomyModel';
import { CameraSetup } from './CameraSetup';

interface BodyViewerProps {
  normalizedExposure: Record<string, number>;
  reverseMapping: Record<string, string>;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background rounded-lg border border-border-subtle z-10">
      <div className="text-text-muted text-sm font-medium animate-pulse">
        Loading 3D Model...
      </div>
    </div>
  );
}

const CAMERA_CONFIG = { fov: 45 };
const GL_CONFIG = { antialias: true };

export function BodyViewer({
  normalizedExposure,
  reverseMapping,
  selectedSlug,
  onSelect,
}: BodyViewerProps) {
  const dpr = 1;

  const [displayBounds, setDisplayBounds] = useState<DisplayBounds | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);

  const handleBoundsCalculated = useCallback((b: DisplayBounds) => {
    setDisplayBounds((prev) => {
      if (prev) return prev;
      console.log('[BodyViewer] Setting displayBounds for the first time:', b);
      return b;
    });
  }, []);

  console.log('[BodyViewer] render with displayBounds:', !!displayBounds);

  const handleReset = () => {
    setResetSignal((s) => s + 1);
  };

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] bg-background rounded-[10px] overflow-hidden border border-border-subtle mb-6">
      {displayBounds && (
        <button
          onClick={handleReset}
          className="absolute bottom-2 right-2 z-10 min-h-9 px-2.5 py-1 text-xs bg-surface-high border border-border-subtle rounded text-text-secondary hover:text-text-primary transition-colors"
          title="Reset Camera View"
        >
          Reset View
        </button>
      )}

      <Suspense fallback={<Loader />}>
        <Canvas
          frameloop="demand"
          dpr={dpr}
          camera={CAMERA_CONFIG}
          gl={GL_CONFIG}
        >
          <color attach="background" args={['#121212']} />

          <ambientLight intensity={1.0} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />

          <AnatomyModel
            normalizedExposure={normalizedExposure}
            reverseMapping={reverseMapping}
            selectedSlug={selectedSlug}
            onSelect={onSelect}
            onBoundsCalculated={handleBoundsCalculated}
          />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.05}
          />

          {displayBounds && (
            <CameraSetup
              bounds={displayBounds}
              resetSignal={resetSignal}
              controlsRef={controlsRef}
            />
          )}
        </Canvas>
      </Suspense>
    </div>
  );
}
