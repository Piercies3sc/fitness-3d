import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import fs from 'fs';
import path from 'path';

// Using exact validated names from Phase 9A report
const MUSCLE_WHITELIST = new Set([
  // Pectoralis Major
  "abdominal part of left pectoralis major",
  "clavicular part of left pectoralis major",
  "sternocostal part of left pectoralis major",
  "abdominal part of right pectoralis major",
  "clavicular part of right pectoralis major",
  "sternocostal part of right pectoralis major",
  // Triceps
  "lateral head of left triceps brachii",
  "long head of left triceps brachii",
  "medial head of left triceps brachii",
  "lateral head of right triceps brachii",
  "long head of right triceps brachii",
  "medial head of right triceps brachii",
  // Anterior Deltoid
  "clavicular part of left deltoid",
  "clavicular part of right deltoid",
  // Quadriceps
  "left rectus femoris",
  "left vastus intermedius",
  "left vastus lateralis",
  "left vastus medialis",
  "right rectus femoris",
  "right vastus intermedius",
  "right vastus lateralis",
  "right vastus medialis",
  // Glutes
  "left gluteus maximus",
  "left gluteus medius",
  "left gluteus minimus",
  "right gluteus maximus",
  "right gluteus medius",
  "right gluteus minimus",
  // Adductors
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
  // Hamstrings
  "left semimembranosus",
  "left semitendinosus",
  "long head of left biceps femoris",
  "short head of left biceps femoris",
  "long head of right biceps femoris",
  "right semimembranosus",
  "right semitendinosus",
  "short head of right biceps femoris",
  // Latissimus Dorsi
  "left latissimus dorsi",
  "right latissimus dorsi",
  // Biceps
  "long head of left biceps brachii",
  "short head of left biceps brachii",
  "long head of right biceps brachii",
  "short head of right biceps brachii",
  // Teres Major
  "left teres major",
  "right teres major",
  // Mid / Lower Trapezius
  "ascending part of left trapezius",
  "transverse part of left trapezius",
  "ascending part of right trapezius",
  "transverse part of right trapezius"
]);

async function build() {
  const io = new NodeIO();
  const srcPath = path.resolve('./assets/anatomy-source/anatomy-source.glb');
  
  console.log(`Loading original GLB: ${srcPath}`);
  const document = await io.read(srcPath);
  const root = document.getRoot();
  
  console.log(`Total nodes before: ${root.listNodes().length}`);
  console.log(`Total meshes before: ${root.listMeshes().length}`);

  // Keep the scene graph intact, just remove meshes from nodes that aren't whitelisted,
  // then let `prune()` clean up the unused meshes and empty nodes safely.
  let removedMeshes = 0;
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;

    const name = node.getName();
    const meshName = mesh.getName();
    
    const isWhitelisted = MUSCLE_WHITELIST.has(name) || MUSCLE_WHITELIST.has(meshName);
    
    if (!isWhitelisted) {
        node.setMesh(null);
        removedMeshes++;
    }
  }
  
  console.log(`Removed meshes from ${removedMeshes} nodes.`);

  // Now prune unused resources
  await document.transform(
    prune(),
    dedup()
  );

  console.log(`Total nodes after prune: ${root.listNodes().length}`);
  console.log(`Total meshes after prune: ${root.listMeshes().length}`);

  const destDir = path.resolve('./public/models');
  if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.resolve(destDir, 'anatomy-v1.glb');
  console.log(`Writing optimized V1 GLB to: ${destPath}`);
  await io.write(destPath, document);

  const finalStats = fs.statSync(destPath);
  console.log(`Final file size: ${(finalStats.size / (1024 * 1024)).toFixed(2)} MB`);
}

build().catch(console.error);
