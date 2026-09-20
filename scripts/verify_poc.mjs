import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

async function main() {
  const io = new NodeIO();
  const pocPath = path.resolve('./artifacts/body-surface-poc/extremity-surface-poc.glb');
  const doc = await io.read(pocPath);
  const root = doc.getRoot();
  const stats = fs.statSync(pocPath);

  console.log('=== VERIFYING POC ASSET ===');
  console.log(`Path: ${pocPath}`);
  console.log(`Size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);

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
  console.log(`Total Triangles: ${totalTriangles}`);
  console.log(`Total Materials: ${root.listMaterials().length}`);
  console.log(`Material Name: ${root.listMaterials()[0]?.getName()}`);

  const nodes = root.listNodes();
  console.log(`Total Nodes: ${nodes.length}`);
  
  const nodeNames = nodes.map(n => n.getName()).sort();
  console.log('Exported Object/Node Names:');
  nodeNames.forEach(n => console.log(`  - ${n}`));

  const leftHandWrist = nodeNames.filter(n => n.endsWith('.l') && (n.includes('wrist') || n.includes('hand') || n.includes('Palm') || n.includes('foveola')));
  const rightHandWrist = nodeNames.filter(n => n.endsWith('.r') && (n.includes('wrist') || n.includes('hand') || n.includes('Palm') || n.includes('foveola')));
  const leftFootAnkle = nodeNames.filter(n => n.endsWith('.l') && !leftHandWrist.includes(n));
  const rightFootAnkle = nodeNames.filter(n => n.endsWith('.r') && !rightHandWrist.includes(n));

  console.log(`\nHand/Wrist Objects: ${leftHandWrist.length + rightHandWrist.length} total`);
  console.log(`Foot/Ankle Objects: ${leftFootAnkle.length + rightFootAnkle.length} total`);
}

main().catch(console.error);
