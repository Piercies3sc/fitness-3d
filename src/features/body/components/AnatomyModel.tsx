'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { isContextMesh, isRedundantExtremityMesh } from '../constants/contextMeshes';
import { getExposureColor } from '@/lib/calculations/visualization';
import { getSelectableMuscleSlug } from '../meshInteraction';

/** Bounds info calculated AFTER the display-space rotation. */
export interface DisplayBounds {
  /** Axis-aligned bounding box of the rotated model. */
  box: { min: [number, number, number]; max: [number, number, number] };
  /** Box center in display space. */
  center: [number, number, number];
  /** Box size in display space (width, height, depth). */
  size: [number, number, number];
}

interface AnatomyModelProps {
  normalizedExposure: Record<string, number>;
  reverseMapping: Record<string, string>;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  onBoundsCalculated?: (bounds: DisplayBounds) => void;
}

export function AnatomyModel({
  normalizedExposure,
  reverseMapping,
  selectedSlug,
  onSelect,
  onBoundsCalculated,
}: AnatomyModelProps) {
  console.log('[AnatomyModel] rendering...');
  const { scene } = useGLTF('/models/anatomy-v5.glb');
  console.log('[AnatomyModel] useGLTF loaded scene with children:', scene.children.length);
  const { invalidate } = useThree();
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const boundsReported = useRef(false);

  // Clean up cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  /**
   * Build a display-ready scene:
   * 1. Clone the cached GLTF scene (so useGLTF cache is never mutated).
   * 2. Restore exact GLTF node names from userData.name (GLTFLoader sanitizes spaces into underscores).
   * 3. Set controlled materials:
   *    - Tracked meshes: neutral #505054 (base of continuous warm color scale).
   *    - Context meshes: restrained dark neutral #36383D (never exposure-colored).
   * 4. Wrap in a parent Group that rotates -π/2 around X to convert Z-up → Y-up.
   *
   * Source anatomy axes (verified from vertex data):
   *   Z = head-to-foot  (tallest axis)
   *   X = left-right
   *   Y = front-back    (-Y = anterior, +Y = posterior)
   *
   * After rotating X by -π/2:
   *   Display Y = source Z (up)
   *   Display Z = -source Y (anterior faces +Z → camera looks from +Z)
   *   Display X = source X (left-right unchanged)
   */
  const displayGroup = useMemo(() => {
    console.log('[AnatomyModel] computing displayGroup...');
    const clone = scene.clone();
    let hiddenCount = 0;

    // Single shared material for all neutral context meshes
    const sharedContextMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#36383D'),
      roughness: 0.75,
      metalness: 0.05,
    });

    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        // GLTFLoader sanitizes node names by converting spaces to underscores.
        // The original unsanitized name is preserved in userData.name.
        if (mesh.userData?.name) {
          mesh.name = mesh.userData.name;
        }

        // Hide redundant extremity meshes (duplicate thin hand/foot layers)
        if (isRedundantExtremityMesh(mesh.name)) {
          mesh.visible = false;
          hiddenCount++;
          return;
        }

        if (isContextMesh(mesh.name)) {
          mesh.material = sharedContextMaterial;
          return;
        }

        // Tracked muscles get individual materials for exposure/selection
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#505054'),
          roughness: 0.65,
          metalness: 0.1,
        });
      }
    });
    console.log(`[AnatomyModel] displayGroup computed. Hidden redundant meshes: ${hiddenCount}`);

    const group = new THREE.Group();
    group.rotation.x = -Math.PI / 2;
    group.add(clone);
    return group;
  }, [scene]);

  // Report display-space bounds exactly once after mount.
  useEffect(() => {
    console.log('[AnatomyModel] useEffect boundsReported:', boundsReported.current);
    if (boundsReported.current || !onBoundsCalculated) return;
    boundsReported.current = true;

    // Force world matrix update so Box3 sees the rotation.
    displayGroup.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(displayGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    console.log('[AnatomyModel] calculated bounds size:', [size.x, size.y, size.z]);
    onBoundsCalculated({
      box: {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
      },
      center: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z],
    });
  }, [displayGroup, onBoundsCalculated]);

  // Reactively update material colors when exposure / selection / hover change.
  useEffect(() => {
    displayGroup.traverse((node) => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const meshName = mesh.name;

      // Redundant extremity meshes remain hidden
      if (isRedundantExtremityMesh(meshName)) {
        mesh.visible = false;
        return;
      }

      // Context meshes: keep static restrained dark neutral material
      if (isContextMesh(meshName)) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;
        mat.color.set('#36383D');
        mat.emissive.setHex(0x000000);
        return;
      }

      // Tracked meshes: resolve to logical muscle slug and apply exposure/selection
      const logicalSlug = reverseMapping[meshName];
      const isSelected = logicalSlug != null && logicalSlug === selectedSlug;
      const isHovered = logicalSlug != null && logicalSlug === hoveredSlug;
      const exposureIntensity = logicalSlug ? (normalizedExposure[logicalSlug] ?? 0) : 0;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      const exposureHex = getExposureColor(exposureIntensity);
      mat.color.set(exposureHex);

      if (isSelected) {
        // Selection preserves underlying exposure color; subtle emissive highlight in its own hue
        mat.emissive.set(exposureHex).multiplyScalar(0.40);
        mat.roughness = 0.45;
      } else if (isHovered) {
        // Subtle hover highlight
        mat.emissive.set(exposureHex).multiplyScalar(0.20);
        mat.roughness = 0.55;
      } else {
        mat.emissive.setHex(0x000000);
        mat.roughness = 0.65;
      }
    });
    // In demand frameloop mode, invalidate to schedule a render frame
    invalidate();
  }, [displayGroup, normalizedExposure, selectedSlug, hoveredSlug, reverseMapping, invalidate]);

  // --- interaction handlers ---

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const meshName = e.object.name;
    if (isContextMesh(meshName)) {
      setHoveredSlug(null);
      document.body.style.cursor = 'auto';
      return;
    }
    const slug = getSelectableMuscleSlug(meshName, reverseMapping);
    if (slug) {
      setHoveredSlug(slug);
      document.body.style.cursor = 'pointer';
    } else {
      setHoveredSlug(null);
      document.body.style.cursor = 'auto';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredSlug(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const meshName = e.object.name;
    const slug = getSelectableMuscleSlug(meshName, reverseMapping);
    if (slug) {
      onSelect(slug === selectedSlug ? null : slug);
    } else {
      onSelect(null);
    }
  };

  const handlePointerMissed = () => {
    onSelect(null);
  };

  return (
    <primitive
      object={displayGroup}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      onPointerMissed={handlePointerMissed}
    />
  );
}

useGLTF.preload('/models/anatomy-v5.glb');
