import { NodeIO } from '@gltf-transform/core';
import path from 'path';

async function main() {
  const io = new NodeIO();
  const pocPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-poc.glb');
  const doc = await io.read(pocPath);
  const root = doc.getRoot();

  console.log('=== NODES IN POC GLB ===');
  console.log(`Total nodes: ${root.listNodes().length}`);
  
  const sampleNodes = [
    'Anterior region of wrist.l',
    'Anterior region of wrist.r',
    'Dorsum of hand.l',
    'Dorsum of hand.r',
    'Anterior region of ankle.l',
    'Anterior region of ankle.r',
    'Heel region.l',
    'Heel region.r'
  ];

  for (const node of root.listNodes()) {
    const name = node.getName();
    if (sampleNodes.includes(name)) {
      console.log(`Node: '${name}'`);
      console.log(`  Translation:`, node.getTranslation());
      console.log(`  Rotation:`, node.getRotation());
      console.log(`  Scale:`, node.getScale());
    }
  }
}

main().catch(console.error);
