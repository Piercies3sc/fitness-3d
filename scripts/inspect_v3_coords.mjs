import { NodeIO } from '@gltf-transform/core';
import path from 'path';

async function main() {
  const io = new NodeIO();
  const doc = await io.read(path.resolve('./public/models/anatomy-v3.glb'));
  const root = doc.getRoot();

  console.log('=== RAW ANATOMY-V3.GLB COORDINATES ===');
  
  const targetMeshes = [
    'left brachioradialis',
    'left flexor carpi radialis',
    'abductor digiti minimi of left hand',
    'left soleus',
    'abductor digiti minimi of left foot'
  ];

  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const name = node.getName() || mesh.getName();
    if (targetMeshes.some(t => name.toLowerCase() === t.toLowerCase())) {
      for (const prim of mesh.listPrimitives()) {
        const pos = prim.getAttribute('POSITION');
        if (pos) {
          const arr = pos.getArray();
          let minX = Infinity, maxX = -Infinity;
          let minY = Infinity, maxY = -Infinity;
          let minZ = Infinity, maxZ = -Infinity;
          for (let i = 0; i < arr.length; i += 3) {
            const x = arr[i], y = arr[i+1], z = arr[i+2];
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
          }
          console.log(`Mesh: '${name}'`);
          console.log(`  X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}]`);
          console.log(`  Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
          console.log(`  Z: [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}]`);
        }
      }
    }
  }
}

main().catch(console.error);
