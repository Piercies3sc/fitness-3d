import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import fs from 'fs';
import path from 'path';

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
  "transverse part of right trapezius"
];

export const CONTEXT_RUNTIME_MESHES = [
  // Abdominal Wall & Lateral Torso (10)
  "left rectus abdominis",
  "right rectus abdominis",
  "left external oblique",
  "right external oblique",
  "left internal oblique",
  "right internal oblique",
  "left transversus abdominis",
  "right transversus abdominis",
  "left serratus anterior",
  "right serratus anterior",

  // Shoulder & Upper Arm Context (8)
  "acromial part of left deltoid",
  "acromial part of right deltoid",
  "spinal part of left deltoid",
  "spinal part of right deltoid",
  "left brachialis",
  "right brachialis",
  "left coracobrachialis",
  "right coracobrachialis",

  // Neck & Upper/Lower Back & Scapular Fossa (18)
  "descending part of left trapezius",
  "descending part of right trapezius",
  "left sternocleidomastoid",
  "right sternocleidomastoid",
  "left rhomboid major",
  "right rhomboid major",
  "left rhomboid minor",
  "right rhomboid minor",
  "left infraspinatus muscle",
  "right infraspinatus muscle",
  "left supraspinatus",
  "right supraspinatus",
  "left teres minor",
  "right teres minor",
  "left iliocostalis lumborum",
  "right iliocostalis lumborum",
  "left longissimus thoracis",
  "right longissimus thoracis",

  // Hip / Pelvic Transition & Thigh Continuity (8)
  "left tensor fasciae latae",
  "right tensor fasciae latae",
  "left sartorius",
  "right sartorius",
  "left iliacus",
  "right iliacus",
  "left psoas major",
  "right psoas major",

  // Forearms (12)
  "left brachioradialis",
  "right brachioradialis",
  "left flexor carpi radialis",
  "right flexor carpi radialis",
  "left extensor carpi radialis longus",
  "right extensor carpi radialis longus",
  "left extensor carpi ulnaris",
  "right extensor carpi ulnaris",
  "humeral head of left flexor carpi ulnaris",
  "humeral head of right flexor carpi ulnaris",
  "humeral head of left pronator teres",
  "humeral head of right pronator teres",

  // Lower Legs (10)
  "lateral head of left gastrocnemius",
  "lateral head of right gastrocnemius",
  "medial head of left gastrocnemius",
  "medial head of right gastrocnemius",
  "left soleus",
  "right soleus",
  "left tibialis anterior",
  "right tibialis anterior",
  "left fibularis longus",
  "right fibularis longus"
];

async function build() {
  const io = new NodeIO();
  const srcPath = path.resolve('./assets/anatomy-source/anatomy-source.glb');

  console.log(`Loading source GLB from: ${srcPath}`);
  const document = await io.read(srcPath);
  const root = document.getRoot();

  const trackedSet = new Set(TRACKED_RUNTIME_MESHES);
  const contextSet = new Set(CONTEXT_RUNTIME_MESHES);
  const combinedSet = new Set([...TRACKED_RUNTIME_MESHES, ...CONTEXT_RUNTIME_MESHES]);

  console.log(`Tracked target: ${trackedSet.size}`);
  console.log(`Context target: ${contextSet.size}`);
  console.log(`Total target: ${combinedSet.size}`);

  let keptTracked = 0;
  let keptContext = 0;
  let removedCount = 0;

  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;

    const name = node.getName();
    const meshName = mesh.getName();

    const isTracked = trackedSet.has(name) || trackedSet.has(meshName);
    const isContext = contextSet.has(name) || contextSet.has(meshName);

    if (isTracked) {
      keptTracked++;
    } else if (isContext) {
      keptContext++;
    } else {
      node.setMesh(null);
      removedCount++;
    }
  }

  console.log(`Kept tracked nodes: ${keptTracked}`);
  console.log(`Kept context nodes: ${keptContext}`);
  console.log(`Removed unneeded nodes: ${removedCount}`);

  await document.transform(
    prune(),
    dedup()
  );

  let totalTriangles = 0;
  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      if (idx) {
        totalTriangles += idx.getCount() / 3;
      }
    }
  }

  const destDir = path.resolve('./public/models');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.resolve(destDir, 'anatomy-v2.glb');
  console.log(`Writing anatomy-v2.glb to: ${destPath}`);
  await io.write(destPath, document);

  const finalStats = fs.statSync(destPath);
  console.log('=== BUILD COMPLETE ===');
  console.log(`Path: ${destPath}`);
  console.log(`Size: ${finalStats.size} bytes (${(finalStats.size / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`Meshes: ${root.listMeshes().length}`);
  console.log(`Nodes: ${root.listNodes().length}`);
  console.log(`Triangles: ${totalTriangles}`);
  console.log(`Materials: ${root.listMaterials().length}`);
}

// If invoked directly from CLI
if (process.argv[1] && process.argv[1].endsWith('build-anatomy-v2.mjs')) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
