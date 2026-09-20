import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';

async function buildAlignedPOC() {
  const io = new NodeIO();
  const srcPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-poc.glb');
  const dstPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-aligned-poc.glb');

  const doc = await io.read(srcPath);
  const root = doc.getRoot();

  function applyQuat(v, q) {
    const x = v[0], y = v[1], z = v[2];
    const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    return [
      ix * qw + iw * -qx + iy * -qz - iz * -qy,
      iy * qw + iw * -qy + iz * -qx - ix * -qz,
      iz * qw + iw * -qz + ix * -qy - iy * -qx
    ];
  }

  // Clusters
  const LEFT_HAND_NODES = [
    'Anterior region of wrist.l', 'Posterior region of wrist.l', 'Radial foveola.l',
    'Palm.l', 'Dorsum of hand.l', 'Palmar surfaces of digits of hand.l', 'Dorsal surfaces of digits of hand.l'
  ];
  const RIGHT_HAND_NODES = [
    'Anterior region of wrist.r', 'Posterior region of wrist.r', 'Radial foveola.r',
    'Palm.r', 'Dorsum of hand.r', 'Palmar surfaces of digits of hand.r', 'Dorsal surfaces of digits of hand.r'
  ];
  const LEFT_FOOT_NODES = [
    'Anterior region of ankle.l', 'Lateral malleolus.l', 'Medial malleolus.l',
    'Lateral retromalleolar region.l', 'Medial retromalleolar region.l',
    'Dorsum of foot.l', 'Heel region.l', 'Sole.l', 'Metatarsal region.l', 'Hallucial eminence.l',
    'Lateral part of longitudinal arch of foot.l', 'Medial part of longitudinal arch of foot.l',
    'Proximal transverse arch of foot.l', 'Distal transverse arch of foot.l',
    'Lateral border of foot.l', 'Medial border of foot.l',
    'Dorsal surfaces of digits of foot.l', 'Plantar surfaces of digits of foot.l'
  ];
  const RIGHT_FOOT_NODES = [
    'Anterior region of ankle.r', 'Lateral malleolus.r', 'Medial malleolus.r',
    'Lateral retromalleolar region.r', 'Medial retromalleolar region.r',
    'Dorsum of foot.r', 'Heel region.r', 'Sole.r', 'Metatarsal region.r', 'Hallucial eminence.r',
    'Lateral part of longitudinal arch of foot.r', 'Medial part of longitudinal arch of foot.r',
    'Proximal transverse arch of foot.r', 'Distal transverse arch of foot.r',
    'Lateral border of foot.r', 'Medial border of foot.r',
    'Dorsal surfaces of digits of foot.r', 'Plantar surfaces of digits of foot.r'
  ];

  // Pivots and Transforms (in mm, Z-up coordinate system matching anatomy-v3.glb)
  const pL_hand = new THREE.Vector3(277.548, -24.417, 858.964);
  const tL_hand = new THREE.Vector3(-27, -86, -1);
  const mL_hand = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-6 * Math.PI / 180, -4 * Math.PI / 180, -8 * Math.PI / 180, 'XYZ'));

  const pR_hand = new THREE.Vector3(-277.548, -24.417, 858.964);
  const tR_hand = new THREE.Vector3(27, -86, -1);
  const mR_hand = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-6 * Math.PI / 180, 4 * Math.PI / 180, 8 * Math.PI / 180, 'XYZ'));

  const pL_foot = new THREE.Vector3(81.022, 43.828, 120.392);
  const tL_foot = new THREE.Vector3(-9, -129, -125);
  const mL_foot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(7 * Math.PI / 180, -6 * Math.PI / 180, 2 * Math.PI / 180, 'XYZ'));

  const pR_foot = new THREE.Vector3(-81.022, 43.828, 120.392);
  const tR_foot = new THREE.Vector3(9, -129, -125);
  const mR_foot = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(7 * Math.PI / 180, 6 * Math.PI / 180, -2 * Math.PI / 180, 'XYZ'));

  let modifiedCount = 0;

  for (const node of root.listNodes()) {
    const name = node.getName();
    let cluster = null, pivot = null, trans = null, rotMatrix = null;

    if (LEFT_HAND_NODES.includes(name)) {
      cluster = 'LEFT_HAND'; pivot = pL_hand; trans = tL_hand; rotMatrix = mL_hand;
    } else if (RIGHT_HAND_NODES.includes(name)) {
      cluster = 'RIGHT_HAND'; pivot = pR_hand; trans = tR_hand; rotMatrix = mR_hand;
    } else if (LEFT_FOOT_NODES.includes(name)) {
      cluster = 'LEFT_FOOT'; pivot = pL_foot; trans = tL_foot; rotMatrix = mL_foot;
    } else if (RIGHT_FOOT_NODES.includes(name)) {
      cluster = 'RIGHT_FOOT'; pivot = pR_foot; trans = tR_foot; rotMatrix = mR_foot;
    }

    if (!cluster) continue;
    modifiedCount++;

    const nodeT = node.getTranslation();
    const nodeR = node.getRotation();
    const nodeS = node.getScale();
    const mesh = node.getMesh();

    for (const prim of mesh.listPrimitives()) {
      const posAttr = prim.getAttribute('POSITION');
      const posArr = posAttr.getArray();
      const newPos = new Float32Array(posArr.length);

      for (let i = 0; i < posArr.length; i += 3) {
        // 1. Get original Blender meter pos
        let v = [posArr[i] * nodeS[0], posArr[i + 1] * nodeS[1], posArr[i + 2] * nodeS[2]];
        v = applyQuat(v, nodeR);
        v = [v[0] + nodeT[0], v[1] + nodeT[1], v[2] + nodeT[2]];

        // 2. Convert to native Z-up millimeter coordinates
        const natX = v[0] * 1000.0;
        const natY = -v[2] * 1000.0;
        const natZ = v[1] * 1000.0;

        // 3. Apply cluster rigid transform
        const pt = new THREE.Vector3(natX - pivot.x, natY - pivot.y, natZ - pivot.z);
        pt.applyMatrix4(rotMatrix);
        pt.add(pivot).add(trans);

        newPos[i] = pt.x;
        newPos[i + 1] = pt.y;
        newPos[i + 2] = pt.z;
      }

      posAttr.setArray(newPos);

      // Rotate normals if present
      const normAttr = prim.getAttribute('NORMAL');
      if (normAttr) {
        const normArr = normAttr.getArray();
        const newNorm = new Float32Array(normArr.length);
        for (let i = 0; i < normArr.length; i += 3) {
          let n = [normArr[i] * nodeS[0], normArr[i + 1] * nodeS[1], normArr[i + 2] * nodeS[2]];
          n = applyQuat(n, nodeR);
          const natNx = n[0];
          const natNy = -n[2];
          const natNz = n[1];

          const nVec = new THREE.Vector3(natNx, natNy, natNz);
          nVec.applyMatrix4(rotMatrix).normalize();
          newNorm[i] = nVec.x;
          newNorm[i + 1] = nVec.y;
          newNorm[i + 2] = nVec.z;
        }
        normAttr.setArray(newNorm);
      }
    }

    // Reset node transform to identity since vertices are now in global aligned space
    node.setTranslation([0, 0, 0]);
    node.setRotation([0, 0, 0, 1]);
    node.setScale([1, 1, 1]);
  }

  console.log('Transformed nodes count: ' + modifiedCount);
  await io.write(dstPath, doc);
  console.log('Wrote aligned POC to: ' + dstPath);

  const stats = fs.statSync(dstPath);
  console.log('Output file size: ' + stats.size + ' bytes');
}

buildAlignedPOC().catch(console.error);
