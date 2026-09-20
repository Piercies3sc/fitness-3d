import { NodeIO } from '@gltf-transform/core';
import fs from 'fs';
import path from 'path';

// Expected mapping matches 0006_muscle_meshes_seed.sql + 0007_expand_exercise_catalog.sql (102 tracked meshes across 21 logical muscles)
export const EXPECTED_MAPPING = {
  'pectoralis-major': [
    'abdominal part of left pectoralis major',
    'clavicular part of left pectoralis major',
    'sternocostal part of left pectoralis major',
    'abdominal part of right pectoralis major',
    'clavicular part of right pectoralis major',
    'sternocostal part of right pectoralis major'
  ],
  'triceps': [
    'lateral head of left triceps brachii',
    'long head of left triceps brachii',
    'medial head of left triceps brachii',
    'lateral head of right triceps brachii',
    'long head of right triceps brachii',
    'medial head of right triceps brachii'
  ],
  'anterior-deltoid': [
    'clavicular part of left deltoid',
    'clavicular part of right deltoid'
  ],
  'quadriceps': [
    'left rectus femoris',
    'left vastus intermedius',
    'left vastus lateralis',
    'left vastus medialis',
    'right rectus femoris',
    'right vastus intermedius',
    'right vastus lateralis',
    'right vastus medialis'
  ],
  'glutes': [
    'left gluteus maximus',
    'left gluteus medius',
    'left gluteus minimus',
    'right gluteus maximus',
    'right gluteus medius',
    'right gluteus minimus'
  ],
  'adductors': [
    'left adductor brevis',
    'left adductor longus',
    'left adductor magnus',
    'left gracilis',
    'left pectineus',
    'right adductor brevis',
    'right adductor longus',
    'right adductor magnus',
    'right gracilis',
    'right pectineus'
  ],
  'hamstrings': [
    'left semimembranosus',
    'left semitendinosus',
    'long head of left biceps femoris',
    'short head of left biceps femoris',
    'long head of right biceps femoris',
    'right semimembranosus',
    'right semitendinosus',
    'short head of right biceps femoris'
  ],
  'latissimus-dorsi': [
    'left latissimus dorsi',
    'right latissimus dorsi'
  ],
  'biceps': [
    'long head of left biceps brachii',
    'short head of left biceps brachii',
    'long head of right biceps brachii',
    'short head of right biceps brachii'
  ],
  'teres-major': [
    'left teres major',
    'right teres major'
  ],
  'mid-lower-trapezius': [
    'ascending part of left trapezius',
    'transverse part of left trapezius',
    'ascending part of right trapezius',
    'transverse part of right trapezius'
  ],
  'lateral-deltoid': [
    'acromial part of left deltoid',
    'acromial part of right deltoid'
  ],
  'posterior-deltoid': [
    'spinal part of left deltoid',
    'spinal part of right deltoid'
  ],
  'calves': [
    'lateral head of left gastrocnemius',
    'lateral head of right gastrocnemius',
    'medial head of left gastrocnemius',
    'medial head of right gastrocnemius',
    'left soleus',
    'right soleus',
    'left calcaneal tendon',
    'right calcaneal tendon'
  ],
  'rectus-abdominis': [
    'left rectus abdominis',
    'right rectus abdominis'
  ],
  'obliques': [
    
        
    'left external oblique',
    'right external oblique',
    'left internal oblique',
    'right internal oblique'
  ],
  'erector-spinae': [
    'left iliocostalis lumborum',
    'right iliocostalis lumborum',
    'left longissimus thoracis',
    'right longissimus thoracis'
  ],
  
  
  'tibialis-anterior': [
    'left tibialis anterior',
    'right tibialis anterior'
  ],
  
  
  
  
  
  
  
  
  

  'fibularis': [
    'left fibularis longus',
    'right fibularis longus',
    'left fibularis brevis',
    'right fibularis brevis',
    'left fibularis tertius',
    'right fibularis tertius'
  ]
};

// Expected context meshes (144 neutral meshes for visual continuity)
export const EXPECTED_CONTEXT = [
  'abductor digiti minimi of left hand',
  'abductor digiti minimi of right hand',
  'descending part of left trapezius',
  'descending part of right trapezius',
  'flexor digiti minimi brevis of left hand',
  'flexor digiti minimi brevis of right hand',
  'humeral head of left flexor carpi ulnaris',
  'humeral head of left pronator teres',
  'humeral head of right flexor carpi ulnaris',
  'humeral head of right pronator teres',
  'left abductor pollicis brevis',
  'left abductor pollicis longus',
  'left anconeus',
  'left brachialis',
  'left brachioradialis',
  'left coracobrachialis',
  'left extensor carpi radialis brevis',
  'left extensor carpi radialis longus',
  'left extensor carpi ulnaris',
  'left extensor carpi ulnaris (2)',
  'left extensor digiti minimi',
  'left extensor digitorum',
  'left extensor digitorum longus',
  'left extensor hallucis longus',
  'left extensor pollicis brevis',
  'left extensor pollicis longus',
  'left flexor carpi radialis',
  'left flexor digitorum longus',
  'left flexor digitorum profundus',
  'left flexor digitorum superficialis',
  'left flexor digitorum superficialis (2)',
  'left flexor hallucis longus',
  'left flexor pollicis longus',
  'left iliacus',
  'left infraspinatus muscle',
  'left opponens pollicis',
  'left palmaris longus',
  'left plantaris',
  'left popliteus',
  'left pronator quadratus',
  'left psoas major',
  'left rhomboid major',
  'left rhomboid minor',
  'left sartorius',
  'left serratus anterior',
  'left sternocleidomastoid',
  'left supinator',
  'left supraspinatus',
  'left tensor fasciae latae',
  'left teres minor',
  'left tibialis posterior',
  'oblique head of left adductor pollicis',
  'oblique head of right adductor pollicis',
  'opponens digiti minimi of left hand',
  'opponens digiti minimi of right hand',
  'right abductor pollicis brevis',
  'right abductor pollicis longus',
  'right anconeus',
  'right brachialis',
  'right brachioradialis',
  'right coracobrachialis',
  'right extensor carpi radialis brevis',
  'right extensor carpi radialis longus',
  'right extensor carpi ulnaris',
  'right extensor carpi ulnaris (2)',
  'right extensor digiti minimi',
  'right extensor digitorum',
  'right extensor digitorum longus',
  'right extensor hallucis longus',
  'right extensor pollicis brevis',
  'right extensor pollicis longus',
  'right flexor carpi radialis',
  'right flexor digitorum longus',
  'right flexor digitorum profundus',
  'right flexor digitorum superficialis',
  'right flexor digitorum superficialis (2)',
  'right flexor hallucis longus',
  'right flexor pollicis longus',
  'right iliacus',
  'right infraspinatus muscle',
  'right opponens pollicis',
  'right palmaris longus',
  'right plantaris',
  'right popliteus',
  'right pronator quadratus',
  'right psoas major',
  'right rhomboid major',
  'right rhomboid minor',
  'right sartorius',
  'right serratus anterior',
  'right sternocleidomastoid',
  'right supinator',
  'right supraspinatus',
  'right tensor fasciae latae',
  'right teres minor',
  'right tibialis posterior',
  'set of dorsal interossei of left hand',
  'set of dorsal interossei of right hand',
  'set of lumbricals of left hand',
  'set of lumbricals of right hand',
  'set of palmar interossei of left hand',
  'set of palmar interossei of right hand',
  'superficial head of left flexor pollicis brevis',
  'superficial head of right flexor pollicis brevis',
  'transverse head of left adductor pollicis',
  'transverse head of right adductor pollicis',
  'ulnar head of left flexor carpi ulnaris',
  'ulnar head of left pronator teres',
  'ulnar head of right flexor carpi ulnaris',
  'ulnar head of right pronator teres',
  'left transversus abdominis',
  'right transversus abdominis',
  'Dorsum of foot.l',
  'Dorsum of foot.r',
  'Heel region.l',
  'Heel region.r',
  'Lateral border of foot.l',
  'Lateral border of foot.r',
  'Medial border of foot.l',
  'Medial border of foot.r',
  'Hallucial eminence.l',
  'Metatarsal region.l',
  'Hallucial eminence.r',
  'Metatarsal region.r',
  'Dorsal surfaces of digits of foot.l',
  'Dorsal surfaces of digits of foot.r',
  'Plantar surfaces of digits of foot.l',
  'Plantar surfaces of digits of foot.r',
  'Distal transverse arch of foot.l',
  'Medial part of longitudinal arch of foot.l',
  'Proximal transverse arch of foot.l',
  'Lateral part of longitudinal arch of foot.l',
  'Sole.l',
  'Distal transverse arch of foot.r',
  'Medial part of longitudinal arch of foot.r',
  'Proximal transverse arch of foot.r',
  'Lateral part of longitudinal arch of foot.r',
  'Sole.r',
  'Anterior region of ankle.l',
  'Anterior region of ankle.r',
  'Lateral malleolus.l',
  'Lateral malleolus.r',
  'Medial malleolus.l',
  'Medial malleolus.r',
  'Lateral retromalleolar region.l',
  'Lateral retromalleolar region.r',
  'Medial retromalleolar region.l',
  'Medial retromalleolar region.r',
  'Anterior region of wrist.l',
  'Anterior region of wrist.r',
  'Posterior region of wrist.l',
  'Posterior region of wrist.r',
  'Radial foveola.l',
  'Radial foveola.r',
  'Dorsum of hand.l',
  'Dorsum of hand.r',
  'Dorsal surfaces of digits of hand.l',
  'Dorsal surfaces of digits of hand.r',
  'Palmar surfaces of digits of hand.l',
  'Palmar surfaces of digits of hand.r',
  'Palm.l',
  'Palm.r'
];

async function validate() {
  const io = new NodeIO();
  const v4Path = path.resolve('./public/models/anatomy-v5.glb');

  if (!fs.existsSync(v4Path)) {
    throw new Error(`GLB file not found at ${v4Path}`);
  }

  const document = await io.read(v4Path);
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

  const glbNames = new Set([...meshNames, ...nodeNames]);

  // Check 1: Duplicate check between tracked and context
  const allTrackedMeshes = new Set(Object.values(EXPECTED_MAPPING).flat());
  const contextSet = new Set(EXPECTED_CONTEXT);

  const overlap = [...allTrackedMeshes].filter(m => contextSet.has(m));
  if (overlap.length > 0) {
    console.error(`[CRITICAL] Identifier collision between tracked and context: ${overlap.join(', ')}`);
    process.exit(1);
  }

  const logicalCount = Object.keys(EXPECTED_MAPPING).length;
  console.log(`=== 1. VALIDATING LOGICAL MUSCLES (${logicalCount} / 21) ===`);
  let trackedMissingCount = 0;
  for (const [logical, expectedMeshes] of Object.entries(EXPECTED_MAPPING)) {
    let hasValid = false;
    for (const expectedMesh of expectedMeshes) {
      if (!glbNames.has(expectedMesh)) {
        console.error(`[ERROR] Missing tracked mesh reference in GLB: ${expectedMesh} (mapped to ${logical})`);
        trackedMissingCount++;
      } else {
        hasValid = true;
      }
    }
    if (!hasValid) {
      console.error(`[CRITICAL] Logical muscle ${logical} has NO valid mappings in the GLB!`);
    } else {
      console.log(`[OK] ${logical} is fully mapped (${expectedMeshes.length} meshes).`);
    }
  }

  console.log(`\n=== 2. VALIDATING CONTEXT MESHES (${EXPECTED_CONTEXT.length} / 123) ===`);
  let contextMissingCount = 0;
  for (const contextMesh of EXPECTED_CONTEXT) {
    if (!glbNames.has(contextMesh)) {
      console.error(`[ERROR] Missing context mesh in GLB: ${contextMesh}`);
      contextMissingCount++;
    }
  }
  if (contextMissingCount === 0) {
    console.log(`[OK] All ${EXPECTED_CONTEXT.length} context meshes exist in anatomy-v5.glb.`);
  }

  console.log(`\n=== 3. VALIDATING GLB MESH ROLES & ORPHANS ===`);
  const allExpected = new Set([...allTrackedMeshes, ...EXPECTED_CONTEXT]);
  let orphanedCount = 0;
  for (const meshName of meshNames) {
    if (!allExpected.has(meshName)) {
      console.warn(`[WARNING] Orphan mesh in GLB not recognized as tracked or context: ${meshName}`);
      orphanedCount++;
    }
  }

  console.log(`\nValidation Summary:`);
  console.log(`  Tracked Meshes: ${allTrackedMeshes.size} expected, Missing: ${trackedMissingCount}`);
  console.log(`  Context Meshes: ${EXPECTED_CONTEXT.length} expected, Missing: ${contextMissingCount}`);
  console.log(`  Orphaned Meshes: ${orphanedCount}`);
  console.log(`  Total GLB Meshes: ${meshNames.size}`);

  if (trackedMissingCount > 0 || contextMissingCount > 0 || orphanedCount > 0) {
    console.error(`[FAILED] Validation failed.`);
    process.exit(1);
  }

  console.log(`\n[PASSED] Validation complete. Missing: 0, Orphaned: 0`);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
