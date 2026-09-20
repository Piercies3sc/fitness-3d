/**
 * Compute the display-space bounds after rotating -PI/2 around X.
 * 
 * Source GLB axes:
 *   X = left-right  (width 459.72)
 *   Y = front-back  (-Y = anterior)  (depth 243.79)
 *   Z = head-to-foot (height 1099.10)
 * 
 * Rotation around X by -PI/2:
 *   display X = source X   (unchanged)
 *   display Y = source Z   (Z-up becomes Y-up)
 *   display Z = -source Y  (-Y anterior becomes +Z, toward camera)
 * 
 * Source bounds:
 *   Min: [-229.86, -219.35, 283.01]
 *   Max: [ 229.86,   24.44, 1382.11]
 */

const srcMin = [-229.86, -219.35, 283.01];
const srcMax = [229.86, 24.44, 1382.11];

// After rotation X by -PI/2:
// display X = source X
// display Y = source Z
// display Z = -source Y

const dispMinX = srcMin[0];
const dispMaxX = srcMax[0];

const dispMinY = srcMin[2]; // source Z min
const dispMaxY = srcMax[2]; // source Z max

// Z = -Y, so min/max swap
const dispMinZ = -srcMax[1]; // -(+24.44) = -24.44
const dispMaxZ = -srcMin[1]; // -(-219.35) = +219.35

console.log('=== DISPLAY-SPACE BOUNDS (after -PI/2 X rotation) ===');
console.log(`Min: [${dispMinX.toFixed(2)}, ${dispMinY.toFixed(2)}, ${dispMinZ.toFixed(2)}]`);
console.log(`Max: [${dispMaxX.toFixed(2)}, ${dispMaxY.toFixed(2)}, ${dispMaxZ.toFixed(2)}]`);

const sizeX = dispMaxX - dispMinX;
const sizeY = dispMaxY - dispMinY;
const sizeZ = dispMaxZ - dispMinZ;
console.log(`Size: [${sizeX.toFixed(2)}, ${sizeY.toFixed(2)}, ${sizeZ.toFixed(2)}]`);

const centerX = (dispMinX + dispMaxX) / 2;
const centerY = (dispMinY + dispMaxY) / 2;
const centerZ = (dispMinZ + dispMaxZ) / 2;
console.log(`Center: [${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)}]`);

// Camera calculation for 390x420 mobile
const fovDeg = 45;
const fovY = fovDeg * (Math.PI / 180);

const halfH = sizeY / 2;
const halfW = sizeX / 2;
const halfD = sizeZ / 2;
const margin = 1.12;

// Mobile: 390x420
const aspectMob = 390 / 420;
const vertMob = (halfH * margin) / Math.tan(fovY / 2);
const fovXmob = 2 * Math.atan(Math.tan(fovY / 2) * aspectMob);
const horizMob = (halfW * margin) / Math.tan(fovXmob / 2);
const fitMob = Math.max(vertMob, horizMob);
const distMob = fitMob + halfD;

console.log('\n=== MOBILE 390x420 ===');
console.log(`Aspect: ${aspectMob.toFixed(4)}`);
console.log(`Vertical fit dist: ${vertMob.toFixed(2)}`);
console.log(`Horizontal fit dist: ${horizMob.toFixed(2)}`);
console.log(`Fit dist (max): ${fitMob.toFixed(2)}`);
console.log(`Initial distance (+ halfDepth): ${distMob.toFixed(2)}`);

// Desktop: 800x500
const aspectDesk = 800 / 500;
const vertDesk = (halfH * margin) / Math.tan(fovY / 2);
const fovXdesk = 2 * Math.atan(Math.tan(fovY / 2) * aspectDesk);
const horizDesk = (halfW * margin) / Math.tan(fovXdesk / 2);
const fitDesk = Math.max(vertDesk, horizDesk);
const distDesk = fitDesk + halfD;

console.log('\n=== DESKTOP 800x500 ===');
console.log(`Aspect: ${aspectDesk.toFixed(4)}`);
console.log(`Vertical fit dist: ${vertDesk.toFixed(2)}`);
console.log(`Horizontal fit dist: ${horizDesk.toFixed(2)}`);
console.log(`Fit dist (max): ${fitDesk.toFixed(2)}`);
console.log(`Initial distance (+ halfDepth): ${distDesk.toFixed(2)}`);

const maxDim = Math.max(sizeX, sizeY, sizeZ);
console.log('\n=== SHARED ===');
console.log(`maxDim: ${maxDim.toFixed(2)}`);
console.log(`minDistance: ${(maxDim * 0.15).toFixed(2)}`);
console.log(`maxDistance: ${(maxDim * 4.0).toFixed(2)}`);
console.log(`near: ${(maxDim * 0.01).toFixed(2)}`);
console.log(`far: ${(maxDim * 20).toFixed(2)}`);
console.log(`Camera position (mobile): [${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${(centerZ + distMob).toFixed(2)}]`);
console.log(`Camera target: [${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)}]`);
