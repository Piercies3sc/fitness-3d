import { NodeIO } from '@gltf-transform/core';
import { mergeDocuments, prune, dedup } from '@gltf-transform/functions';
import fs from 'fs';
import path from 'path';

// 102 tracked runtime meshes across 21 logical muscles.
export const TRACKED_RUNTIME_MESHES = [
  // Pectoralis Major (6)
  "abdominal part of left pectoralis major",
  "clavicular part of left pectoralis major",
  "sternocostal part of left pectoralis major",
  "abdominal part of right pectoralis major",
  "clavicular part of right pectoralis major",
  "sternocostal part of right pectoralis major",
  // Triceps (6)
  "lateral head of left triceps brachii",
  "long head of left triceps brachii",
  "medial head of left triceps brachii",
  "lateral head of right triceps brachii",
  "long head of right triceps brachii",
  "medial head of right triceps brachii",
  // Anterior Deltoid (2)
  "clavicular part of left deltoid",
  "clavicular part of right deltoid",
  // Quadriceps (8)
  "left rectus femoris",
  "left vastus intermedius",
  "left vastus lateralis",
  "left vastus medialis",
  "right rectus femoris",
  "right vastus intermedius",
  "right vastus lateralis",
  "right vastus medialis",
  // Glutes (6)
  "left gluteus maximus",
  "left gluteus medius",
  "left gluteus minimus",
  "right gluteus maximus",
  "right gluteus medius",
  "right gluteus minimus",
  // Adductors (10)
  "left adductor brevis",
  "left adductor longus",
  "left adductor magnus",
  "left gracilis",
  "left pectineus",
  "right adductor brevis",
  "right adductor longus",
  "right adductor magnus",
  "right gracilis",
  "right pectineus",
  // Hamstrings (8)
  "left semimembranosus",
  "left semitendinosus",
  "long head of left biceps femoris",
  "short head of left biceps femoris",
  "long head of right biceps femoris",
  "right semimembranosus",
  "right semitendinosus",
  "short head of right biceps femoris",
  // Latissimus Dorsi (2)
  "left latissimus dorsi",
  "right latissimus dorsi",
  // Biceps (4)
  "long head of left biceps brachii",
  "short head of left biceps brachii",
  "long head of right biceps brachii",
  "short head of right biceps brachii",
  // Teres Major (2)
  "left teres major",
  "right teres major",
  // Mid / Lower Trapezius (4)
  "ascending part of left trapezius",
  "transverse part of left trapezius",
  "ascending part of right trapezius",
  "transverse part of right trapezius",
  // Lateral Deltoid (2)
  "acromial part of left deltoid",
  "acromial part of right deltoid",
  // Posterior Deltoid (2)
  "spinal part of left deltoid",
  "spinal part of right deltoid",
  // Calves (6)
  "lateral head of left gastrocnemius",
  "lateral head of right gastrocnemius",
  "medial head of left gastrocnemius",
  "medial head of right gastrocnemius",
  "left soleus",
  "right soleus",
  // Rectus Abdominis (2)
  "left rectus abdominis",
  "right rectus abdominis",
  // Obliques (4)
  "left external oblique",
  "right external oblique",
  "left internal oblique",
  "right internal oblique",
  // Erector Spinae (4)
  "left iliocostalis lumborum",
  "right iliocostalis lumborum",
  "left longissimus thoracis",
  "right longissimus thoracis",
  // Tibialis Anterior (2)
  "left tibialis anterior",
  "right tibialis anterior",
  // Fibularis / Peroneals (6)
  "left fibularis longus",
  "right fibularis longus",
  "left fibularis brevis",
  "right fibularis brevis",
  "left fibularis tertius",
  "right fibularis tertius"
];

// 38 deep intrinsic foot context meshes omitted due to protrusion below the skin arch/sole
export const OMITTED_FOOT_CONTEXT_MESHES = [
  'left abductor hallucis',
  'right abductor hallucis',
  'left long plantar ligament',
  'right long plantar ligament',
  'left flexor accessorius',
  'right flexor accessorius',
  'left flexor digitorum brevis',
  'right flexor digitorum brevis',
  'medial head of left flexor hallucis brevis',
  'medial head of right flexor hallucis brevis',
  'lateral head of left flexor hallucis brevis',
  'lateral head of right flexor hallucis brevis',
  'oblique head of left adductor hallucis',
  'oblique head of right adductor hallucis',
  'transverse head of left adductor hallucis',
  'transverse head of right adductor hallucis',
  'abductor digiti minimi of left foot',
  'abductor digiti minimi of right foot',
  'flexor digiti minimi brevis of left foot',
  'flexor digiti minimi brevis of right foot',
  'opponens digiti minimi of left foot',
  'opponens digiti minimi of right foot',
  'left extensor hallucis brevis',
  'right extensor hallucis brevis',
  'first lumbrical of left foot',
  'first lumbrical of right foot',
  'second lumbrical of left foot',
  'second lumbrical of right foot',
  'third lumbrical of left foot',
  'third lumbrical of right foot',
  'fourth lumbrical of left foot',
  'fourth lumbrical of right foot',
  'first plantar interosseous of left foot',
  'first plantar interosseous of right foot',
  'second plantar interosseous of left foot',
  'second plantar interosseous of right foot',
  'third plantar interosseous of left foot',
  'third plantar interosseous of right foot',
];

// 50 Z-Anatomy extremity surface context meshes
export const EXTREMITY_SURFACE_MESHES = [
  // Left Hand & Wrist (7)
  'Anterior region of wrist.l',
  'Posterior region of wrist.l',
  'Radial foveola.l',
  'Palm.l',
  'Dorsum of hand.l',
  'Palmar surfaces of digits of hand.l',
  'Dorsal surfaces of digits of hand.l',

  // Right Hand & Wrist (7)
  'Anterior region of wrist.r',
  'Posterior region of wrist.r',
  'Radial foveola.r',
  'Palm.r',
  'Dorsum of hand.r',
  'Palmar surfaces of digits of hand.r',
  'Dorsal surfaces of digits of hand.r',

  // Left Foot & Ankle (18)
  'Anterior region of ankle.l',
  'Lateral malleolus.l',
  'Medial malleolus.l',
  'Lateral retromalleolar region.l',
  'Medial retromalleolar region.l',
  'Dorsum of foot.l',
  'Heel region.l',
  'Sole.l',
  'Metatarsal region.l',
  'Hallucial eminence.l',
  'Lateral part of longitudinal arch of foot.l',
  'Medial part of longitudinal arch of foot.l',
  'Proximal transverse arch of foot.l',
  'Distal transverse arch of foot.l',
  'Lateral border of foot.l',
  'Medial border of foot.l',
  'Dorsal surfaces of digits of foot.l',
  'Plantar surfaces of digits of foot.l',

  // Right Foot & Ankle (18)
  'Anterior region of ankle.r',
  'Lateral malleolus.r',
  'Medial malleolus.r',
  'Lateral retromalleolar region.r',
  'Medial retromalleolar region.r',
  'Dorsum of foot.r',
  'Heel region.r',
  'Sole.r',
  'Metatarsal region.r',
  'Hallucial eminence.r',
  'Lateral part of longitudinal arch of foot.r',
  'Medial part of longitudinal arch of foot.r',
  'Proximal transverse arch of foot.r',
  'Distal transverse arch of foot.r',
  'Lateral border of foot.r',
  'Medial border of foot.r',
  'Dorsal surfaces of digits of foot.r',
  'Plantar surfaces of digits of foot.r',
];

export async function buildAnatomyV4() {
  const io = new NodeIO();
  const v3Path = path.resolve('./public/models/anatomy-v3.glb');
  const pocPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-aligned-poc.glb');
  const destPath = path.resolve('./public/models/anatomy-v4.glb');

  console.log('=== BUILDING ANATOMY-V4.GLB ===');
  console.log(`Source v3: ${v3Path}`);
  console.log(`Source POC: ${pocPath}`);

  if (!fs.existsSync(v3Path)) {
    throw new Error(`v3 GLB not found at ${v3Path}`);
  }
  if (!fs.existsSync(pocPath)) {
    throw new Error(`Aligned POC GLB not found at ${pocPath}`);
  }

  const v3Doc = await io.read(v3Path);
  const pocDoc = await io.read(pocPath);

  // 1. Remove omitted deep foot context meshes from v3
  const omittedSet = new Set(OMITTED_FOOT_CONTEXT_MESHES);
  let omittedCount = 0;
  for (const node of v3Doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    const name = node.getName();
    const meshName = mesh ? mesh.getName() : '';
    if (omittedSet.has(name) || omittedSet.has(meshName)) {
      node.dispose();
      if (mesh) mesh.dispose();
      omittedCount++;
    }
  }
  console.log(`Removed ${omittedCount} omitted deep foot context nodes from v3.`);

  // 2. Prepare extremity surface POC in pocDoc:
  // Ensure mesh name matches node name for each surface patch, and apply restrained neutral material
  const neutralMat = pocDoc.createMaterial('Neutral_Surface_Context')
    .setBaseColorFactor([0.2118, 0.2196, 0.2392, 1.0]) // #36383D
    .setRoughnessFactor(0.75)
    .setMetallicFactor(0.05);

  const surfaceSet = new Set(EXTREMITY_SURFACE_MESHES);
  for (const node of pocDoc.getRoot().listNodes()) {
    const name = node.getName();
    if (surfaceSet.has(name)) {
      const mesh = node.getMesh();
      if (mesh) {
        mesh.setName(name);
        for (const prim of mesh.listPrimitives()) {
          prim.setMaterial(neutralMat);
        }
      }
    }
  }

  // 3. Merge pocDoc into v3Doc
  mergeDocuments(v3Doc, pocDoc);

  // 4. Consolidate into single scene under BodyMuscles
  const root = v3Doc.getRoot();
  const bodyMusclesNode = root.listNodes().find(n => n.getName() === 'BodyMuscles');
  if (!bodyMusclesNode) {
    throw new Error('BodyMuscles parent node not found in v3Doc');
  }

  const scenes = root.listScenes();
  for (let i = 1; i < scenes.length; i++) {
    const extraScene = scenes[i];
    for (const child of extraScene.listChildren()) {
      bodyMusclesNode.addChild(child);
    }
    extraScene.dispose();
  }

  // 5. Consolidate buffers into a single buffer for valid GLB
  const buffers = root.listBuffers();
  if (buffers.length > 1) {
    const primaryBuffer = buffers[0];
    for (let i = 1; i < buffers.length; i++) {
      const b = buffers[i];
      for (const a of root.listAccessors()) {
        if (a.getBuffer() === b) {
          a.setBuffer(primaryBuffer);
        }
      }
      b.dispose();
    }
  }

  // 6. Run prune & dedup
  await v3Doc.transform(
    prune(),
    dedup()
  );

  // 7. Write anatomy-v4.glb
  console.log(`Writing anatomy-v4.glb to: ${destPath}`);
  await io.write(destPath, v3Doc);

  // 7. Inspect resulting asset
  const stats = fs.statSync(destPath);
  let totalTriangles = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      if (idx) totalTriangles += idx.getCount() / 3;
      else {
        const pos = prim.getAttribute('POSITION');
        if (pos) totalTriangles += pos.getCount() / 3;
      }
    }
  }

  console.log('=== BUILD COMPLETE ===');
  console.log(`Path: ${destPath}`);
  console.log(`Size: ${stats.size} bytes (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Meshes: ${root.listMeshes().length}`);
  console.log(`Nodes: ${root.listNodes().length}`);
  console.log(`Triangles: ${totalTriangles}`);
  console.log(`Materials: ${root.listMaterials().length}`);

  return {
    path: destPath,
    size: stats.size,
    meshCount: root.listMeshes().length,
    nodeCount: root.listNodes().length,
    triangleCount: totalTriangles,
    materialCount: root.listMaterials().length
  };
}

if (process.argv[1] && process.argv[1].endsWith('build-anatomy-v4.mjs')) {
  buildAnatomyV4().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
