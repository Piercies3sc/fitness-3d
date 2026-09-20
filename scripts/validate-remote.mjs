import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

async function validate() {
  const io = new NodeIO();
  const v1Path = path.resolve('./public/models/anatomy-v1.glb');
  
  if (!fs.existsSync(v1Path)) {
    throw new Error(`GLB file not found at ${v1Path}`);
  }

  const document = await io.read(v1Path);
  const root = document.getRoot();
  
  const meshNames = new Set();
  const nodeNames = new Set();
  
  for (const node of root.listNodes()) {
    nodeNames.add(node.getName());
    const mesh = node.getMesh();
    if (mesh) {
        meshNames.add(mesh.getName());
    }
  }

  let missingCount = 0;
  let orphanedCount = 0;
  const glbNames = new Set([...meshNames, ...nodeNames]);

  const remoteMappingsStr = fs.readFileSync(path.resolve('./scripts/remote_mappings.json'), 'utf8');
  const remoteMappings = JSON.parse(remoteMappingsStr);
  const EXPECTED_MAPPING = {};
  for (const m of remoteMappings) {
      EXPECTED_MAPPING[m.slug] = m.expected_meshes;
  }

  console.log("=== VALIDATING REMOTE LOGICAL MUSCLES ===");
  for (const [logical, expectedMeshes] of Object.entries(EXPECTED_MAPPING)) {
    let hasValid = false;
    for (const expectedMesh of expectedMeshes) {
        if (!glbNames.has(expectedMesh)) {
            console.error(`[ERROR] Missing remote deployed mesh reference in GLB: ${expectedMesh} (mapped to ${logical})`);
            missingCount++;
        } else {
            hasValid = true;
        }
    }
    if (!hasValid) {
        console.error(`[CRITICAL] Logical muscle ${logical} has NO valid mappings in the GLB!`);
    } else {
        console.log(`[OK] ${logical} is fully mapped.`);
    }
  }

  console.log("\n=== VALIDATING GLB MESHES ===");
  const allExpectedMeshes = new Set(Object.values(EXPECTED_MAPPING).flat());
  for (const meshName of meshNames) {
    if (!allExpectedMeshes.has(meshName)) {
        console.warn(`[WARNING] Orphan mesh in GLB not mapped to any remote logical muscle: ${meshName}`);
        orphanedCount++;
    }
  }

  console.log(`\nValidation complete. Missing: ${missingCount}, Orphaned: ${orphanedCount}`);
  if (missingCount > 0) {
      process.exit(1);
  }
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
