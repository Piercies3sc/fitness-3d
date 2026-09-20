import { NodeIO } from '@gltf-transform/core';
import path from 'path';

async function inspect() {
  const io = new NodeIO();
  const srcPath = path.resolve('./assets/anatomy-source/anatomy-source.glb');
  const doc = await io.read(srcPath);
  const root = doc.getRoot();

  const meshes = [];
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const name = mesh.getName() || node.getName();
    meshes.push(name);
  }

  console.log(`Total meshes in source: ${meshes.length}`);

  // Let's filter by anatomical keywords
  const keywords = {
    forearm_arm: ['brach', 'carpi', 'digitorum', 'pronator', 'supinator', 'palmaris', 'pollicis', 'anconeus'],
    hand: ['hand', 'lumbrical', 'interossei', 'abductor digiti', 'flexor digiti', 'opponens', 'palmar', 'thenar', 'hypothenar'],
    lower_leg: ['gastrocnemius', 'soleus', 'tibialis', 'fibularis', 'peroneus', 'plantaris', 'popliteus'],
    foot: ['hallucis', 'pedis', 'plantar', 'abductor digiti minimi', 'flexor digitorum brevis', 'quadratus plantae', 'dorsal interossei'],
    head_neck: ['capitis', 'colli', 'cervicis', 'platysma', 'digastric', 'mylohyoid', 'scalenus', 'hyoid', 'temporalis', 'masseter', 'occipitalis', 'frontalis']
  };

  for (const [category, words] of Object.entries(keywords)) {
    const matches = meshes.filter(m => words.some(w => m.toLowerCase().includes(w)));
    console.log(`\n=== Category: ${category} (${matches.length} meshes) ===`);
    matches.sort().forEach(m => console.log(`  - ${m}`));
  }
}

inspect().catch(console.error);
