import { NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';

async function buildAlignedPOC() {
  const io = new NodeIO();
  const srcPocPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-poc.glb');
  const srcAnatomyPath = path.resolve('./public/models/anatomy-v3.glb');
  const dstPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-aligned-poc-v5.glb');

  const pocDoc = await io.read(srcPocPath);
  const pocRoot = pocDoc.getRoot();
  
  const anatDoc = await io.read(srcAnatomyPath);
  const anatRoot = anatDoc.getRoot();

  function getGroupBounds(root, nodeNames, docScale = 1.0) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (const name of nodeNames) {
      const n = root.listNodes().find(x => x.getName() === name);
      if (!n) continue;
      const mesh = n.getMesh();
      if (!mesh) continue;
      
      const pos = n.getTranslation();
      const rot = n.getRotation();
      const sc = n.getScale();
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3().fromArray(pos),
        new THREE.Quaternion().fromArray(rot),
        new THREE.Vector3().fromArray(sc)
      );
      
      for (const p of mesh.listPrimitives()) {
        const posAttr = p.getAttribute('POSITION');
        if (!posAttr) continue;
        const arr = posAttr.getArray();
        for(let i=0; i<arr.length; i+=3) {
          let v = new THREE.Vector3(arr[i], arr[i+1], arr[i+2]);
          v.applyMatrix4(m);
          
          if (docScale !== 1.0) {
            const nx = v.x * 1000.0;
            const ny = -v.z * 1000.0;
            const nz = v.y * 1000.0;
            v = new THREE.Vector3(nx, ny, nz);
          }
          
          minX = Math.min(minX, v.x); minY = Math.min(minY, v.y); minZ = Math.min(minZ, v.z);
          maxX = Math.max(maxX, v.x); maxY = Math.max(maxY, v.y); maxZ = Math.max(maxZ, v.z);
        }
      }
    }
    return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ], center: [(minX+maxX)/2, (minY+maxY)/2, (minZ+maxZ)/2], size: [maxX-minX, maxY-minY, maxZ-minZ] };
  }

  const lHandInner = [
    'abductor digiti minimi of left hand', 'flexor digiti minimi brevis of left hand', 'left abductor pollicis brevis',
    'left opponens pollicis', 'opponens digiti minimi of left hand', 'set of dorsal interossei of left hand',
    'set of lumbricals of left hand', 'set of palmar interossei of left hand', 'superficial head of left flexor pollicis brevis'
  ];
  const lHandOuter = [
    'Palm.l', 'Dorsum of hand.l', 'Palmar surfaces of digits of hand.l', 'Dorsal surfaces of digits of hand.l',
    'Anterior region of wrist.l', 'Posterior region of wrist.l', 'Radial foveola.l'
  ];
  
  const lFootInner = [
    'abductor digiti minimi of left foot', 'flexor digiti minimi brevis of left foot', 'left abductor hallucis',
    'left extensor hallucis brevis', 'left flexor digitorum brevis', 'opponens digiti minimi of left foot',
    'first lumbrical of left foot', 'first plantar interosseous of left foot'
  ];
  const lFootOuter = [
    'Heel region.l', 'Sole.l', 'Metatarsal region.l', 'Hallucial eminence.l', 'Dorsum of foot.l', 
    'Dorsal surfaces of digits of foot.l', 'Plantar surfaces of digits of foot.l',
    'Anterior region of ankle.l', 'Lateral malleolus.l', 'Medial malleolus.l', 'Lateral retromalleolar region.l',
    'Medial retromalleolar region.l', 'Lateral part of longitudinal arch of foot.l', 'Medial part of longitudinal arch of foot.l',
    'Proximal transverse arch of foot.l', 'Distal transverse arch of foot.l', 'Lateral border of foot.l', 'Medial border of foot.l'
  ];
  
  const rHandInner = lHandInner.map(n => n.replace('left', 'right').replace('.l', '.r'));
  const rHandOuter = lHandOuter.map(n => n.replace('left', 'right').replace('.l', '.r'));
  
  const rFootInner = lFootInner.map(n => n.replace('left', 'right').replace('.l', '.r'));
  const rFootOuter = lFootOuter.map(n => n.replace('left', 'right').replace('.l', '.r'));

  const lhi = getGroupBounds(anatRoot, lHandInner, 1.0);
  const lho = getGroupBounds(pocRoot, lHandOuter, 1000.0);
  const lht = new THREE.Vector3(lhi.center[0] - lho.center[0], lhi.center[1] - lho.center[1], lhi.center[2] - lho.center[2]);
  
  const rhi = getGroupBounds(anatRoot, rHandInner, 1.0);
  const rho = getGroupBounds(pocRoot, rHandOuter, 1000.0);
  const rht = new THREE.Vector3(rhi.center[0] - rho.center[0], rhi.center[1] - rho.center[1], rhi.center[2] - rho.center[2]);
  
  const lfi = getGroupBounds(anatRoot, lFootInner, 1.0);
  const lfo = getGroupBounds(pocRoot, lFootOuter, 1000.0);
  const lft = new THREE.Vector3(lfi.center[0] - lfo.center[0], lfi.center[1] - lfo.center[1], lfi.center[2] - lfo.center[2]);
  
  const rfi = getGroupBounds(anatRoot, rFootInner, 1.0);
  const rfo = getGroupBounds(pocRoot, rFootOuter, 1000.0);
  const rft = new THREE.Vector3(rfi.center[0] - rfo.center[0], rfi.center[1] - rfo.center[1], rfi.center[2] - rfo.center[2]);

  console.log('Left Hand Translation:', lht);
  console.log('Right Hand Translation:', rht);
  console.log('Left Foot Translation:', lft);
  console.log('Right Foot Translation:', rft);

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

  let modifiedCount = 0;
  for (const node of pocRoot.listNodes()) {
    const name = node.getName();
    let trans = null;

    if (lHandOuter.includes(name)) trans = lht;
    else if (rHandOuter.includes(name)) trans = rht;
    else if (lFootOuter.includes(name)) trans = lft;
    else if (rFootOuter.includes(name)) trans = rft;

    if (!trans) continue;
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

        // 3. Apply translation
        const pt = new THREE.Vector3(natX, natY, natZ).add(trans);

        newPos[i] = pt.x;
        newPos[i + 1] = pt.y;
        newPos[i + 2] = pt.z;
      }
      posAttr.setArray(newPos);

      // Rotate normals if present (no rotation needed for translation only)
      const normAttr = prim.getAttribute('NORMAL');
      if (normAttr) {
        const normArr = normAttr.getArray();
        const newNorm = new Float32Array(normArr.length);
        for (let i = 0; i < normArr.length; i += 3) {
          let n = [normArr[i] * nodeS[0], normArr[i + 1] * nodeS[1], normArr[i + 2] * nodeS[2]];
          n = applyQuat(n, nodeR);
          newNorm[i] = n[0];
          newNorm[i + 1] = -n[2];
          newNorm[i + 2] = n[1];
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
  await io.write(dstPath, pocDoc);
  console.log('Wrote aligned POC to: ' + dstPath);
}

buildAlignedPOC().catch(console.error);
