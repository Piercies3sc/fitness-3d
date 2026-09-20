import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

async function main() {
  const io = new NodeIO();
  const alignedPocPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-aligned-poc.glb');
  const v3Path = path.resolve('./public/models/anatomy-v3.glb');

  const pocDoc = await io.read(alignedPocPath);
  const v3Doc = await io.read(v3Path);

  const pocRoot = pocDoc.getRoot();
  const stats = fs.statSync(alignedPocPath);

  console.log('=== 1. BASIC ASSET METRICS ===');
  console.log(`Path: ${alignedPocPath}`);
  console.log(`Size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

  let totalTriangles = 0;
  for (const mesh of pocRoot.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      if (idx) totalTriangles += idx.getCount() / 3;
      else {
        const pos = prim.getAttribute('POSITION');
        if (pos) totalTriangles += pos.getCount() / 3;
      }
    }
  }
  console.log(`Total Triangles: ${totalTriangles}`);
  console.log(`Total Meshes: ${pocRoot.listMeshes().length}`);
  console.log(`Total Nodes: ${pocRoot.listNodes().length}`);
  console.log(`Total Materials: ${pocRoot.listMaterials().length}`);
  console.log(`Material Name: ${pocRoot.listMaterials()[0]?.getName()}`);

  const originalExpectedNames = [
    'Anterior region of wrist.l', 'Posterior region of wrist.l', 'Radial foveola.l',
    'Palm.l', 'Dorsum of hand.l', 'Palmar surfaces of digits of hand.l', 'Dorsal surfaces of digits of hand.l',
    'Anterior region of wrist.r', 'Posterior region of wrist.r', 'Radial foveola.r',
    'Palm.r', 'Dorsum of hand.r', 'Palmar surfaces of digits of hand.r', 'Dorsal surfaces of digits of hand.r',
    'Anterior region of ankle.l', 'Lateral malleolus.l', 'Medial malleolus.l',
    'Lateral retromalleolar region.l', 'Medial retromalleolar region.l',
    'Dorsum of foot.l', 'Heel region.l', 'Sole.l', 'Metatarsal region.l', 'Hallucial eminence.l',
    'Lateral part of longitudinal arch of foot.l', 'Medial part of longitudinal arch of foot.l',
    'Proximal transverse arch of foot.l', 'Distal transverse arch of foot.l',
    'Lateral border of foot.l', 'Medial border of foot.l',
    'Dorsal surfaces of digits of foot.l', 'Plantar surfaces of digits of foot.l',
    'Anterior region of ankle.r', 'Lateral malleolus.r', 'Medial malleolus.r',
    'Lateral retromalleolar region.r', 'Medial retromalleolar region.r',
    'Dorsum of foot.r', 'Heel region.r', 'Sole.r', 'Metatarsal region.r', 'Hallucial eminence.r',
    'Lateral part of longitudinal arch of foot.r', 'Medial part of longitudinal arch of foot.r',
    'Proximal transverse arch of foot.r', 'Distal transverse arch of foot.r',
    'Lateral border of foot.r', 'Medial border of foot.r',
    'Dorsal surfaces of digits of foot.r', 'Plantar surfaces of digits of foot.r'
  ];

  const nodeNames = pocRoot.listNodes().map(n => n.getName());
  const allNamesPreserved = originalExpectedNames.every(name => nodeNames.includes(name)) && nodeNames.length === 50;
  console.log(`All original object names preserved: ${allNamesPreserved ? 'YES' : 'NO'}`);

  // Helpers to get point clouds
  function getNodeVerts(doc, nodeNames) {
    let pts = [];
    for (const node of doc.getRoot().listNodes()) {
      if (nodeNames.includes(node.getName())) {
        const mesh = node.getMesh();
        for (const prim of mesh.listPrimitives()) {
          const pos = prim.getAttribute('POSITION');
          const arr = pos.getArray();
          for (let i = 0; i < arr.length; i += 3) {
            pts.push([arr[i], arr[i+1], arr[i+2]]);
          }
        }
      }
    }
    return pts;
  }

  function getBBox(pts) {
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const p of pts) {
      for (let j = 0; j < 3; j++) {
        if (p[j] < min[j]) min[j] = p[j];
        if (p[j] > max[j]) max[j] = p[j];
      }
    }
    return { min, max, size: [max[0]-min[0], max[1]-min[1], max[2]-min[2]], center: [(min[0]+max[0])/2, (min[1]+max[1])/2, (min[2]+max[2])/2] };
  }

  console.log('\n=== 2. CLUSTER BOUNDING BOXES (mm, Z-up) ===');
  const leftHandPts = getNodeVerts(pocDoc, originalExpectedNames.slice(0, 7));
  const rightHandPts = getNodeVerts(pocDoc, originalExpectedNames.slice(7, 14));
  const leftFootPts = getNodeVerts(pocDoc, originalExpectedNames.slice(14, 32));
  const rightFootPts = getNodeVerts(pocDoc, originalExpectedNames.slice(32, 50));

  console.log('LEFT_HAND:', getBBox(leftHandPts));
  console.log('RIGHT_HAND:', getBBox(rightHandPts));
  console.log('LEFT_FOOT:', getBBox(leftFootPts));
  console.log('RIGHT_FOOT:', getBBox(rightFootPts));

  console.log('\n=== 3. GAP & CLEARANCE ANALYSIS AGAINST ANATOMY-V3 ===');

  // Left Forearm Distal Rim vs Left Wrist Proximal Rim
  const leftWristRim = getNodeVerts(pocDoc, ['Anterior region of wrist.l', 'Posterior region of wrist.l', 'Radial foveola.l']).filter(p => p[2] > 840);
  const leftForearmRim = getNodeVerts(v3Doc, [
    'left pronator quadratus', 'left flexor carpi radialis', 'left extensor carpi radialis brevis',
    'left extensor carpi radialis longus', 'left extensor carpi ulnaris', 'left brachioradialis'
  ]).filter(p => p[2] >= 835 && p[2] <= 855);

  let wristDistSum = 0, maxWristDist = 0;
  for (const wp of leftWristRim) {
    let minD = Infinity;
    for (const fp of leftForearmRim) {
      const d = Math.hypot(wp[0]-fp[0], wp[1]-fp[1], wp[2]-fp[2]);
      if (d < minD) minD = d;
    }
    wristDistSum += minD;
    if (minD > maxWristDist) maxWristDist = minD;
  }
  const avgWristGap = wristDistSum / leftWristRim.length;
  console.log(`Left Wrist Interface Gap to Forearm: Avg = ${avgWristGap.toFixed(2)} mm, Max = ${maxWristDist.toFixed(2)} mm`);

  // Right Wrist Interface Gap
  const rightWristRim = getNodeVerts(pocDoc, ['Anterior region of wrist.r', 'Posterior region of wrist.r', 'Radial foveola.r']).filter(p => p[2] > 840);
  const rightForearmRim = getNodeVerts(v3Doc, [
    'right pronator quadratus', 'right flexor carpi radialis', 'right extensor carpi radialis brevis',
    'right extensor carpi radialis longus', 'right extensor carpi ulnaris', 'right brachioradialis'
  ]).filter(p => p[2] >= 835 && p[2] <= 855);

  let rWristDistSum = 0, maxRWristDist = 0;
  for (const wp of rightWristRim) {
    let minD = Infinity;
    for (const fp of rightForearmRim) {
      const d = Math.hypot(wp[0]-fp[0], wp[1]-fp[1], wp[2]-fp[2]);
      if (d < minD) minD = d;
    }
    rWristDistSum += minD;
    if (minD > maxRWristDist) maxRWristDist = minD;
  }
  const avgRWristGap = rWristDistSum / rightWristRim.length;
  console.log(`Right Wrist Interface Gap to Forearm: Avg = ${avgRWristGap.toFixed(2)} mm, Max = ${maxRWristDist.toFixed(2)} mm`);

  // Left Ankle Interface Gap vs Left Lower Leg Distal Rim
  const leftAnkleRim = getNodeVerts(pocDoc, [
    'Anterior region of ankle.l', 'Lateral malleolus.l', 'Medial malleolus.l',
    'Lateral retromalleolar region.l', 'Medial retromalleolar region.l'
  ]).filter(p => p[2] > -20);
  const leftLegRim = getNodeVerts(v3Doc, [
    'left calcaneal tendon', 'left tibialis anterior', 'left tibialis posterior', 'left fibularis longus', 'left fibularis brevis'
  ]).filter(p => p[2] >= -30 && p[2] <= 10);

  let ankleDistSum = 0, maxAnkleDist = 0;
  for (const ap of leftAnkleRim) {
    let minD = Infinity;
    for (const lp of leftLegRim) {
      const d = Math.hypot(ap[0]-lp[0], ap[1]-lp[1], ap[2]-lp[2]);
      if (d < minD) minD = d;
    }
    ankleDistSum += minD;
    if (minD > maxAnkleDist) maxAnkleDist = minD;
  }
  const avgAnkleGap = ankleDistSum / leftAnkleRim.length;
  console.log(`Left Ankle Interface Gap to Lower Leg: Avg = ${avgAnkleGap.toFixed(2)} mm, Max = ${maxAnkleDist.toFixed(2)} mm`);

  // Right Ankle Interface Gap vs Right Lower Leg Distal Rim
  const rightAnkleRim = getNodeVerts(pocDoc, [
    'Anterior region of ankle.r', 'Lateral malleolus.r', 'Medial malleolus.r',
    'Lateral retromalleolar region.r', 'Medial retromalleolar region.r'
  ]).filter(p => p[2] > -20);
  const rightLegRim = getNodeVerts(v3Doc, [
    'right calcaneal tendon', 'right tibialis anterior', 'right tibialis posterior', 'right fibularis longus', 'right fibularis brevis'
  ]).filter(p => p[2] >= -30 && p[2] <= 10);

  let rAnkleDistSum = 0, maxRAnkleDist = 0;
  for (const ap of rightAnkleRim) {
    let minD = Infinity;
    for (const lp of rightLegRim) {
      const d = Math.hypot(ap[0]-lp[0], ap[1]-lp[1], ap[2]-lp[2]);
      if (d < minD) minD = d;
    }
    rAnkleDistSum += minD;
    if (minD > maxRAnkleDist) maxRAnkleDist = minD;
  }
  const avgRAnkleGap = rAnkleDistSum / rightAnkleRim.length;
  console.log(`Right Ankle Interface Gap to Lower Leg: Avg = ${avgRAnkleGap.toFixed(2)} mm, Max = ${maxRAnkleDist.toFixed(2)} mm`);

  // Helpers to get point clouds by substring
  function getNodeVertsByPattern(doc, patterns) {
    let pts = [];
    for (const node of doc.getRoot().listNodes()) {
      const name = node.getName();
      if (patterns.some(p => name.toLowerCase().includes(p.toLowerCase()))) {
        const mesh = node.getMesh();
        if (!mesh) continue;
        for (const prim of mesh.listPrimitives()) {
          const pos = prim.getAttribute('POSITION');
          if (!pos) continue;
          const arr = pos.getArray();
          for (let i = 0; i < arr.length; i += 3) {
            pts.push([arr[i], arr[i+1], arr[i+2]]);
          }
        }
      }
    }
    return pts;
  }

  // Muscle enclosure checks:
  // Hand muscles
  const leftHandMuscles = getNodeVertsByPattern(v3Doc, ['of left hand']);
  const handBox = getBBox(leftHandPts);
  let handMusclesOutside = 0;
  for (const p of leftHandMuscles) {
    if (p[0] < handBox.min[0] - 8 || p[0] > handBox.max[0] + 8 ||
        p[1] < handBox.min[1] - 8 || p[1] > handBox.max[1] + 8 ||
        p[2] < handBox.min[2] - 8 || p[2] > handBox.max[2] + 8) {
      handMusclesOutside++;
    }
  }
  console.log(`Left Hand Muscle Points outside skin (+8mm envelope): ${handMusclesOutside} / ${leftHandMuscles.length} (${(handMusclesOutside/leftHandMuscles.length*100).toFixed(2)}%)`);

  // Right Hand muscles
  const rightHandMuscles = getNodeVertsByPattern(v3Doc, ['of right hand']);
  const rHandBox = getBBox(rightHandPts);
  let rHandMusclesOutside = 0;
  for (const p of rightHandMuscles) {
    if (p[0] < rHandBox.min[0] - 8 || p[0] > rHandBox.max[0] + 8 ||
        p[1] < rHandBox.min[1] - 8 || p[1] > rHandBox.max[1] + 8 ||
        p[2] < rHandBox.min[2] - 8 || p[2] > rHandBox.max[2] + 8) {
      rHandMusclesOutside++;
    }
  }
  console.log(`Right Hand Muscle Points outside skin (+8mm envelope): ${rHandMusclesOutside} / ${rightHandMuscles.length} (${(rHandMusclesOutside/rightHandMuscles.length*100).toFixed(2)}%)`);

  // Foot muscles (intrinsic foot muscles that should be inside the foot)
  const leftFootMuscles = getNodeVertsByPattern(v3Doc, [
    'of left foot', 'left abductor hallucis', 'left extensor hallucis brevis',
    'flexor hallucis brevis', 'adductor hallucis'
  ]).filter(p => p[2] < 20); // only in foot region
  const footBox = getBBox(leftFootPts);
  let footMusclesOutside = 0;
  for (const p of leftFootMuscles) {
    if (p[0] < footBox.min[0] - 8 || p[0] > footBox.max[0] + 8 ||
        p[1] < footBox.min[1] - 8 || p[1] > footBox.max[1] + 8 ||
        p[2] < footBox.min[2] - 8 || p[2] > footBox.max[2] + 8) {
      footMusclesOutside++;
    }
  }
  console.log(`Left Foot Intrinsic Muscle Points outside skin (+8mm envelope): ${footMusclesOutside} / ${leftFootMuscles.length} (${(footMusclesOutside/leftFootMuscles.length*100).toFixed(2)}%)`);

  // Right Foot muscles
  const rightFootMuscles = getNodeVertsByPattern(v3Doc, [
    'of right foot', 'right abductor hallucis', 'right extensor hallucis brevis',
    'flexor hallucis brevis', 'adductor hallucis'
  ]).filter(p => p[2] < 20);
  const rFootBox = getBBox(rightFootPts);
  let rFootMusclesOutside = 0;
  for (const p of rightFootMuscles) {
    if (p[0] < rFootBox.min[0] - 8 || p[0] > rFootBox.max[0] + 8 ||
        p[1] < rFootBox.min[1] - 8 || p[1] > rFootBox.max[1] + 8 ||
        p[2] < rFootBox.min[2] - 8 || p[2] > rFootBox.max[2] + 8) {
      rFootMusclesOutside++;
    }
  }
  console.log(`Right Foot Intrinsic Muscle Points outside skin (+8mm envelope): ${rFootMusclesOutside} / ${rightFootMuscles.length} (${(rFootMusclesOutside/rightFootMuscles.length*100).toFixed(2)}%)`);
}

main().catch(console.error);
