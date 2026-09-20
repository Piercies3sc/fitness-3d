import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

async function analyze() {
  const io = new NodeIO();
  const document = await io.read(path.resolve('./public/models/anatomy-v1.glb'));
  
  const root = document.getRoot();
  
  const nodes = root.listNodes();
  const meshes = root.listMeshes();
  const materials = root.listMaterials();
  
  let totalTriangles = 0;
  let totalPrimitives = 0;
  
  for (const mesh of meshes) {
    const primitives = mesh.listPrimitives();
    totalPrimitives += primitives.length;
    for (const prim of primitives) {
      const indices = prim.getIndices();
      if (indices) {
        if (prim.getMode() === 4) { // TRIANGLES
            totalTriangles += indices.getCount() / 3;
        }
      } else {
        const position = prim.getAttribute('POSITION');
        if (position && prim.getMode() === 4) {
            totalTriangles += position.getCount() / 3;
        }
      }
    }
  }

  const stats = fs.statSync('./public/models/anatomy-v1.glb');

  console.log(JSON.stringify({
    size_bytes: stats.size,
    node_count: nodes.length,
    mesh_count: meshes.length,
    primitive_count: totalPrimitives,
    material_count: materials.length,
    total_triangles: totalTriangles,
  }, null, 2));
}

analyze().catch(console.error);
