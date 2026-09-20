# Third-Party Assets

This project uses the following third-party assets which require attribution.

## 3D Anatomy Model
The 3D anatomy model used in this application is a derived, optimized subset of the **BodyExplorer** repository by Johan Bellander. The original data originates from the BodyParts3D and Z-Anatomy projects.

### Source Information
- **Source Repositories:**
  - [BodyExplorer by JohanBellander](https://github.com/JohanBellander/BodyExplorer) (derived from BodyParts3D)
  - [Z-Anatomy](https://www.z-anatomy.com/) (open-source anatomical atlas)
- **Current Runtime Asset:** `public/models/anatomy-v4.glb` (optimized derived asset combining 102 tracked muscle meshes, 98 retained anatomical context meshes, and 50 Z-Anatomy extremity surface region meshes)
- **Historical Assets:** `public/models/anatomy-v3.glb`, `public/models/anatomy-v2.glb` (preserved for reference/rollback)

### Licenses & Attribution
- **BodyParts3D Data:** Licensed under [CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/). (c) Database Center for Life Science (DBCLS).
- **Z-Anatomy Data:** Licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

The `anatomy-v4.glb` file distributed with this application is a strictly optimized derived asset (containing 102 tracked muscles + 148 neutral context meshes = 250 total meshes) produced for real-time web performance. Extremity surface regions (hands, wrists, feet, ankles) originate from Z-Anatomy under CC BY-SA 4.0; internal musculature originates from BodyExplorer/BodyParts3D under CC BY-SA 2.1 JP. The derived model retains all applicable CC BY-SA licensing requirements.
