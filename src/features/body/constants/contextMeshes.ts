/**
 * Explicit whitelist of neutral anatomical context meshes included in anatomy-v3.glb.
 * These meshes provide visual continuity across the entire anatomical human silhouette:
 * - Abdominal wall & lateral torso
 * - Shoulder & upper arm
 * - Neck & upper/lower back & scapular fossa
 * - Hip / pelvic transition & thigh continuity
 * - Forearm flexor/extensor compartments from elbow to wrist
 * - Hand / wrist / palm / thumb / digits
 * - Lower leg shin / lateral / posterior / ankle transition (including Achilles calcaneal tendon)
 * - Foot heel / arch / sole / digits
 *
 * They are strictly CONTEXT ONLY:
 * - NOT mapped to our 21 logical fitness muscles
 * - Do NOT receive Training Exposure
 * - Noninteractive (no cursor pointer, no selection)
 * - Rendered in restrained dark neutral material (#36383D)
 */
export const CONTEXT_RUNTIME_MESHES = [
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
] as const;

export const CONTEXT_MESH_SET = new Set<string>(CONTEXT_RUNTIME_MESHES);

export function isContextMesh(meshName: string): boolean {
  return CONTEXT_MESH_SET.has(meshName);
}

/**
 * Redundant extremity meshes that create duplicate visual layers
 * (duplicated hands, fingers, feet, toes, or protruding thin anatomy)
 * because complete outer-surface geometry already provides the external silhouette.
 *
 * These are hidden from normal 3D rendering to ensure:
 * - Exactly one clean hand per side
 * - Exactly one clean foot per side
 * - Natural wrist and ankle silhouettes
 *
 * None of these meshes are tracked muscles (all tracked muscles are preserved).
 */
export const REDUNDANT_EXTREMITY_MESHES = [
  // Intrinsic hand muscles (22)
  'abductor digiti minimi of left hand',
  'abductor digiti minimi of right hand',
  'flexor digiti minimi brevis of left hand',
  'flexor digiti minimi brevis of right hand',
  'opponens digiti minimi of left hand',
  'opponens digiti minimi of right hand',
  'left abductor pollicis brevis',
  'right abductor pollicis brevis',
  'left opponens pollicis',
  'right opponens pollicis',
  'oblique head of left adductor pollicis',
  'oblique head of right adductor pollicis',
  'transverse head of left adductor pollicis',
  'transverse head of right adductor pollicis',
  'superficial head of left flexor pollicis brevis',
  'superficial head of right flexor pollicis brevis',
  'set of dorsal interossei of left hand',
  'set of dorsal interossei of right hand',
  'set of lumbricals of left hand',
  'set of lumbricals of right hand',
  'set of palmar interossei of left hand',
  'set of palmar interossei of right hand',

  // Extrinsic digit flexor/extensor tendons entering the hand (18)
  'left extensor digitorum',
  'right extensor digitorum',
  'left flexor digitorum superficialis',
  'right flexor digitorum superficialis',
  'left flexor digitorum superficialis (2)',
  'right flexor digitorum superficialis (2)',
  'left flexor digitorum profundus',
  'right flexor digitorum profundus',
  'left extensor digiti minimi',
  'right extensor digiti minimi',
  'left extensor pollicis longus',
  'right extensor pollicis longus',
  'left extensor pollicis brevis',
  'right extensor pollicis brevis',
  'left flexor pollicis longus',
  'right flexor pollicis longus',
  'left abductor pollicis longus',
  'right abductor pollicis longus',
  'left palmaris longus',
  'right palmaris longus',

  // Extrinsic foot tendons entering toes/foot (untracked) (12)
  'left extensor digitorum longus',
  'right extensor digitorum longus',
  'left extensor hallucis longus',
  'right extensor hallucis longus',
  'left flexor digitorum longus',
  'right flexor digitorum longus',
  'left flexor hallucis longus',
  'right flexor hallucis longus',
  'left plantaris',
  'right plantaris',
  'left tibialis posterior',
  'right tibialis posterior',
] as const;

export const REDUNDANT_EXTREMITY_MESH_SET = new Set<string>(REDUNDANT_EXTREMITY_MESHES);

export function isRedundantExtremityMesh(meshName: string): boolean {
  return REDUNDANT_EXTREMITY_MESH_SET.has(meshName);
}
