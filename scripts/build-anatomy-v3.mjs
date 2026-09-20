import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import fs from 'fs';
import path from 'path';

// 94 tracked meshes across 19 logical muscles - UNCHANGED
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
  // Hip Flexors (4)
  "left iliacus",
  "right iliacus",
  "left psoas major",
  "right psoas major"
];

// Context meshes for visual completeness (144 total)
export const CONTEXT_RUNTIME_MESHES = [
  // 1. Existing Torso & Shoulder & Neck & Hip Context from v2 (26 meshes)
  // Abdominal Wall & Lateral Torso Context (4)
  "left transversus abdominis",
  "right transversus abdominis",
  "left serratus anterior",
  "right serratus anterior",
  // Shoulder & Upper Arm Context (4)
  "left brachialis",
  "right brachialis",
  "left coracobrachialis",
  "right coracobrachialis",
  // Neck & Upper/Lower Back & Scapular Fossa Context (14)
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
  // Hip / Pelvic Transition & Thigh Continuity (4)
  "left tensor fasciae latae",
  "right tensor fasciae latae",
  "left sartorius",
  "right sartorius",

  // 2. Existing Lower Legs Context from v2 (4 meshes)
  "left tibialis anterior",
  "right tibialis anterior",
  "left fibularis longus",
  "right fibularis longus",

  // 3. NEW Forearm Silhouette Context (34 meshes)
  "left extensor digitorum",
  "right extensor digitorum",
  "left extensor carpi radialis brevis",
  "right extensor carpi radialis brevis",
  "left flexor digitorum superficialis",
  "right flexor digitorum superficialis",
  "left flexor digitorum superficialis (2)",
  "right flexor digitorum superficialis (2)",
  "left flexor digitorum profundus",
  "right flexor digitorum profundus",
  "left flexor pollicis longus",
  "right flexor pollicis longus",
  "left palmaris longus",
  "right palmaris longus",
  "left abductor pollicis longus",
  "right abductor pollicis longus",
  "left extensor pollicis longus",
  "right extensor pollicis longus",
  "left extensor pollicis brevis",
  "right extensor pollicis brevis",
  "left extensor digiti minimi",
  "right extensor digiti minimi",
  "left pronator quadratus",
  "right pronator quadratus",
  "left anconeus",
  "right anconeus",
  "left supinator",
  "right supinator",
  "ulnar head of left pronator teres",
  "ulnar head of right pronator teres",
  "ulnar head of left flexor carpi ulnaris",
  "ulnar head of right flexor carpi ulnaris",
  "left extensor carpi ulnaris (2)",
  "right extensor carpi ulnaris (2)",

  // 4. NEW Hand & Wrist Context (22 meshes)
  "abductor digiti minimi of left hand",
  "abductor digiti minimi of right hand",
  "flexor digiti minimi brevis of left hand",
  "flexor digiti minimi brevis of right hand",
  "opponens digiti minimi of left hand",
  "opponens digiti minimi of right hand",
  "left abductor pollicis brevis",
  "right abductor pollicis brevis",
  "left opponens pollicis",
  "right opponens pollicis",
  "superficial head of left flexor pollicis brevis",
  "superficial head of right flexor pollicis brevis",
  "transverse head of left adductor pollicis",
  "transverse head of right adductor pollicis",
  "oblique head of left adductor pollicis",
  "oblique head of right adductor pollicis",
  "set of lumbricals of left hand",
  "set of lumbricals of right hand",
  "set of dorsal interossei of left hand",
  "set of dorsal interossei of right hand",
  "set of palmar interossei of left hand",
  "set of palmar interossei of right hand",

  // 5. NEW Lower Leg Continuity & Achilles / Ankle Context (20 meshes)
  "left calcaneal tendon",
  "right calcaneal tendon",
  "left tibialis posterior",
  "right tibialis posterior",
  "left fibularis brevis",
  "right fibularis brevis",
  "left fibularis tertius",
  "right fibularis tertius",
  "left extensor digitorum longus",
  "right extensor digitorum longus",
  "left flexor digitorum longus",
  "right flexor digitorum longus",
  "left flexor hallucis longus",
  "right flexor hallucis longus",
  "left plantaris",
  "right plantaris",
  "left popliteus",
  "right popliteus",
  "left extensor hallucis longus",
  "right extensor hallucis longus",

  // 6. NEW Foot & Heel & Midfoot & Toe Context (38 meshes)
  "left abductor hallucis",
  "right abductor hallucis",
  "left long plantar ligament",
  "right long plantar ligament",
  "left flexor accessorius",
  "right flexor accessorius",
  "left flexor digitorum brevis",
  "right flexor digitorum brevis",
  "medial head of left flexor hallucis brevis",
  "medial head of right flexor hallucis brevis",
  "lateral head of left flexor hallucis brevis",
  "lateral head of right flexor hallucis brevis",
  "oblique head of left adductor hallucis",
  "oblique head of right adductor hallucis",
  "transverse head of left adductor hallucis",
  "transverse head of right adductor hallucis",
  "abductor digiti minimi of left foot",
  "abductor digiti minimi of right foot",
  "flexor digiti minimi brevis of left foot",
  "flexor digiti minimi brevis of right foot",
  "opponens digiti minimi of left foot",
  "opponens digiti minimi of right foot",
  "left extensor hallucis brevis",
  "right extensor hallucis brevis",
  "first lumbrical of left foot",
  "first lumbrical of right foot",
  "second lumbrical of left foot",
  "second lumbrical of right foot",
  "third lumbrical of left foot",
  "third lumbrical of right foot",
  "fourth lumbrical of left foot",
  "fourth lumbrical of right foot",
  "first plantar interosseous of left foot",
  "first plantar interosseous of right foot",
  "second plantar interosseous of left foot",
  "second plantar interosseous of right foot",
  "third plantar interosseous of left foot",
  "third plantar interosseous of right foot"
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

  const destPath = path.resolve(destDir, 'anatomy-v3.glb');
  console.log(`Writing anatomy-v3.glb to: ${destPath}`);
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
if (process.argv[1] && process.argv[1].endsWith('build-anatomy-v3.mjs')) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
