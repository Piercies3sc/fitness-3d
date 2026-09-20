'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { DisplayBounds } from './AnatomyModel';

/**
 * Pure function: given display-space bounds and canvas dimensions, compute
 * canonical front-view camera configuration using bounding-box fit
 * (not bounding-sphere).
 */
export function computeCameraConfig(
  bounds: DisplayBounds,
  canvasWidth: number,
  canvasHeight: number,
) {
  const fovDeg = 45;
  const fovY = fovDeg * (Math.PI / 180);
  const aspect = canvasWidth / canvasHeight;

  const halfHeight = bounds.size[1] / 2; // display Y = body height
  const halfWidth = bounds.size[0] / 2;  // display X = body width
  const halfDepth = bounds.size[2] / 2;  // display Z = body depth

  const margin = 1.12; // 12% breathing room

  // Distance to fit vertically
  const verticalFitDist = (halfHeight * margin) / Math.tan(fovY / 2);

  // Horizontal FOV derived from aspect ratio
  const fovX = 2 * Math.atan(Math.tan(fovY / 2) * aspect);
  const horizontalFitDist = (halfWidth * margin) / Math.tan(fovX / 2);

  // Use whichever axis needs more distance
  const fitDist = Math.max(verticalFitDist, horizontalFitDist);

  // Camera sits on +Z (anterior front). Add halfDepth so we clear the model surface.
  const initialDistance = fitDist + halfDepth;

  const maxDim = Math.max(bounds.size[0], bounds.size[1], bounds.size[2]);

  return {
    position: new THREE.Vector3(
      bounds.center[0],
      bounds.center[1],
      bounds.center[2] + initialDistance,
    ),
    target: new THREE.Vector3(...bounds.center),
    near: maxDim * 0.01,
    far: maxDim * 20,
    minDistance: maxDim * 0.15,
    maxDistance: maxDim * 4.0,
  };
}

/**
 * CameraSetup runs inside the R3F render loop via useFrame.
 *
 * It applies the canonical camera config exactly once on mount and again
 * whenever resetSignal increments. It never fires on range/exposure changes.
 *
 * By using useFrame instead of useEffect, we avoid lint issues around mutating
 * Three.js objects returned from useThree() inside effects.
 */
export function CameraSetup({
  bounds,
  resetSignal,
  controlsRef,
}: {
  bounds: DisplayBounds;
  resetSignal: number;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}) {
  const appliedRef = useRef(-1);

  useFrame(({ camera, gl, invalidate }) => {
    if (appliedRef.current === resetSignal) return;
    appliedRef.current = resetSignal;

    const cam = camera as THREE.PerspectiveCamera;
    const canvas = gl.domElement;
    const config = computeCameraConfig(bounds, canvas.clientWidth, canvas.clientHeight);

    cam.position.copy(config.position);
    cam.near = config.near;
    cam.far = config.far;
    cam.updateProjectionMatrix();

    const orbit = controlsRef.current;
    if (orbit) {
      orbit.target.copy(config.target);
      orbit.minDistance = config.minDistance;
      orbit.maxDistance = config.maxDistance;
      orbit.update();
    }

    invalidate();
  });

  // Also read the three context for an initial invalidate to kickstart the first frame.
  const { invalidate } = useThree();
  const kickRef = useRef<boolean | null>(null);
  if (kickRef.current == null) {
    kickRef.current = true;
    // Schedule an invalidation so the demand-mode Canvas renders the first frame.
    queueMicrotask(() => invalidate());
  }

  return null;
}
