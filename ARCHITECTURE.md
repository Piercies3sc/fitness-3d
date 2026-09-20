# Architecture Specification

## 1. Architecture Goal
Design a maintainable architecture for a personal, mobile-first responsive fitness web application whose central loop is: **3D exercise learning → workout logging → muscle Training Exposure → personal progress**.

The architecture must be realistic for a solo student developer utilizing AI-assisted implementation (Antigravity), capable of gradual development, and ready for deployment as a web application. It should allow for future expansion after the 3-exercise proof of concept.

**Optimize for:** Simplicity, maintainability, type safety, clear boundaries, mobile performance, reliable fitness calculations, and good 3D performance.
**Do NOT optimize for:** Hypothetical enterprise scale. Avoid architecture astronautics.

## 2. Locked High-Level Stack
Unless a serious technical incompatibility is discovered, use the following stack:

*   **Frontend / Framework:** Next.js, React, TypeScript, App Router
*   **Styling:** Tailwind CSS, CSS variables/tokens for design-system values, accessible primitives (e.g., Radix) where useful. Do NOT make shadcn or any component library the visual identity.
*   **3D:** Three.js, React Three Fiber, Drei, GLB/glTF assets (from Blender)
*   **Backend / DB / Auth:** Supabase, Supabase Auth, PostgreSQL (via Supabase), Row Level Security (RLS)
*   **Charts:** Recharts
*   **Validation:** Zod
*   **Forms:** React Hook Form (where warranted)
*   **Client State:** Prefer normal React state. Use Zustand ONLY for genuinely shared/transient client state where it simplifies implementation. No Redux.
*   **Deployment:** Vercel
*   **Package Management:** Standard npm.

**Do NOT include:** GraphQL, microservices, separate Express/Nest backend, Prisma, Redux, Kubernetes, Docker requirements, or unnecessary infrastructure layers.

## 3. Architectural Principles
1. Keep product/business logic separate from presentation.
2. Fitness calculations must not live directly inside React components.
3. Store raw workout facts whenever possible and derive analytics from them.
4. Avoid storing derived metrics when they can be reliably recalculated.
5. Do not duplicate source-of-truth data.
6. Use relational database constraints where useful.
7. Treat user fitness data as private user-owned data.
8. Use Supabase Row Level Security rather than relying only on UI-level authorization.
9. Keep public exercise/anatomy catalog data separate from user-owned workout data.
10. Avoid premature abstraction.
11. Build around the initial 3 exercises without hard-coding the entire application specifically to those 3 exercises.
12. Future exercise expansion should primarily be data/content expansion, not architectural rewriting.

## 4. Application Routing
**Public / Guest-capable:**
*   `/` (or appropriate entry route)
*   `/exercises`
*   `/exercises/[slug]`
*   `/body`
*   `/body/[muscleSlug]`

**Authentication:**
*   `/login`
*   `/register`

**Authenticated Product Areas:**
*   `/home`
*   `/workout`
*   `/workout/routines`
*   `/workout/history`
*   `/workout/active/[workoutId]`
*   `/workouts/[workoutId]`
*   `/settings`

No routes for out-of-scope features (e.g., social, nutrition). The application is not a marketing website.

## 5. Database Model
**USER PROFILE:** Supabase auth user reference, unit preference, timestamps.
**EXERCISES:** Seeded initially with Bench Press, Squat, Lat Pulldown ONLY. Includes name, slug, equipment, movement type, educational content, 3D model/animation reference, active/inactive state.
**MUSCLES:** Logical muscles (e.g., Pectoralis Major, Triceps, Anterior Deltoid, Quadriceps, Glutes, Adductors, Hamstrings, Latissimus Dorsi, Biceps, Teres Major, Mid/Lower Trapezius). Independent from specific 3D meshes.
**EXERCISE ↔ MUSCLE MAPPING:** Exercise, muscle, role, exposure factor. Configurable product data (do NOT store Training Exposure totals as canonical historical records).
**BODY / ANATOMY MESH MAPPING:** Logical muscle to multiple 3D mesh names (e.g., `pectoralis_major` → left mesh, right mesh).
**ROUTINES:** User ownership, name, ordered exercises, planned set count, optional target rep range.
**WORKOUTS:** User ownership, optional source routine, workout name, started timestamp, completed timestamp, status.
**WORKOUT EXERCISES:** Preserves performed exercises and ordering.
**WORKOUT SETS:** Workout exercise, set number/ordering, set type (warmup/working), canonical weight, reps, completion, timestamps. No RPE/RIR in V1.

## 6. Canonical Unit Storage
*   **Storage:** Store weights canonically in **kilograms (kg)** in the database.
*   **Presentation:** Convert to the user's preference (kg or lb) only at application boundaries (presentation and input handling).
*   **Integrity:** Unit conversion must be deterministic and tested, with documented numeric precision handling to prevent historical corruption from repeated kg↔lb conversions.

## 7. Derived Data Strategy
*   **STORED FACTS:** Completed workouts, exercises, set types, canonical weight, reps, timestamps.
*   **DERIVED METRICS:** Workout volume, exercise volume, Estimated 1RM, Training Exposure, recent trends, personal records, weekly averages.
Prefer calculating derived metrics from raw facts instead of permanent storage. Caching/precomputation is a future optimization, not for V1.

## 8. Training Exposure
A pure domain calculation.
*   **Formula:** For each completed WORKING set: `muscle exposure contribution = 1 working set × exercise-muscle exposure factor`. Warm-up sets = 0.
*   Derived from completed working sets, exercise-muscle mapping, and selected time range.
*   Do NOT calculate from workout volume or treat external load as muscle-specific volume.
*   Do NOT store exposure totals as immutable truth; recalculate historical exposure based on current mappings. Versioned physiological models are not required for V1.

## 9. Workout Volume
A deterministic domain calculation.
*   **Formula:** `volume contribution = canonical weight × reps` (summed for applicable sets).
*   Belongs to exercise/workout analysis, separate from Training Exposure. (Do NOT use terms like "Chest volume").

## 10. Estimated 1RM
*   **Formula:** Epley (`weight × (1 + reps / 30)`).
*   **Application Heuristic:** Valid only for **1–12 repetitions inclusive**. Positive weight/reps from completed working sets only.
*   Always labeled "Estimated 1RM". Do not fabricate estimates if no qualifying sets exist. Keep the valid range as a configured domain constant.

## 11. Personal Records
Derived from workout history. V1 categories: Weight PR, Rep PR (in a meaningful context), Estimated 1RM PR. Avoid meaningless comparisons and gamification (no achievements, badges, etc.).

## 12. Client / Server Responsibility
*   **Server Components:** Authentication handling, authorization, secure data access, initial data fetching.
*   **Client Components:** Interaction-heavy areas (active workout inputs, rest timer, interactive charts, 3D viewers, rotating/selectable anatomy, immediate UI state).
Maintain clear boundaries; do not force everything into one component type.

## 13. Data Access
Create a lightweight, clear data-access layer rather than scattering Supabase calls in components. Organize around Supabase client creation, authenticated server access, data queries, domain calculations, and validation. No heavy DAO/repository hierarchy.

## 14. Authorization / RLS
*   **Private Data:** `profiles`, `routines`, `workouts`, `workout_exercises`, `workout_sets` MUST be protected by Supabase RLS.
*   **Public Data:** Exercise catalog, muscle definitions, mappings.
*   Never hardcode secrets or place service-role credentials in the browser. Use `.env.example`.

## 15. Active Workout State
Transient client state handles the active workout. Canonical completed training history belongs in Supabase. Completed sets should be persisted reliably enough that normal navigation doesn't destroy recorded data, but a full offline-first sync engine is NOT a V1 requirement.

## 16. 3D Architecture
Blender → GLB / glTF → React Three Fiber.
Separate concepts:
A. **EXERCISE MODEL:** Movement education, playback, rotation, zoom.
B. **ANATOMY / BODY MODEL:** Muscle selection, Training Exposure visualization, navigation. (They do not have to be the same GLB file).

## 17. 3D Naming Conventions
Define stable slugs before integrating assets.
*   **Logical IDs:** `pectoralis_major`, `latissimus_dorsi`
*   **Mesh Names:** `muscle__pectoralis_major__L`, `muscle__pectoralis_major__R`
*   **Animations:** `exercise__bench_press`
Do not depend on default Blender names (`Cube.001`).

## 18. Blender → Web Asset Pipeline
*Pipeline:* Clean object naming → rigging → animation → bake where required → apply/verify transforms → GLB export → web optimization → application asset loading.
*Principles:* Avoid unnecessary polygon density/oversized textures, minimize materials, reasonable draw calls, test on mobile, lazy-load large assets (do not load all on startup).

## 19. 3D Asset Storage
Start with versioned static application assets for the initial 3-exercise prototype. Cloud object storage/CDN is a future optimization if model sizes grow.

## 20. 3D Performance
*   Dynamically load 3D viewer code.
*   Lazy-load GLB models.
*   Dispose of resources properly.
*   Avoid unnecessary post-processing, decorative WebGL scenes, and complex lights/materials.
*   Test on mid-range mobile hardware. Do not keep multiple heavy scenes mounted.

## 21. Proposed Source Organization
```
src/
  app/
  components/
    ui/
    workout/
    exercises/
    body/
    charts/
    three/
  features/
    auth/
    workout/
    exercises/
    progress/
    training-exposure/
  lib/
    supabase/
    calculations/
    validation/
  hooks/
  types/
  config/
public/
  models/
  textures/
```
Keep it simple. Do not create complex feature-sliced architecture unnecessarily.

## 22. Domain Calculations
Pure, deterministic, testable functions separated from UI code:
`calculateEstimated1RM()`, `calculateWorkoutVolume()`, `calculateExerciseVolume()`, `calculateTrainingExposure()`, `detectPersonalRecords()`, `convertKgToLb()`, `convertLbToKg()`.

## 23. Testing Strategy
*   **Runner:** Vitest.
*   **Priority:** High-value unit tests for Estimated 1RM, volume, Training Exposure, unit conversion, and PR detection.
*   Selective component tests and eventual few critical E2E tests. No massive test infrastructure upfront.

## 24. Error Handling
Never silently discard workout input. Surface actionable errors. Do not expose raw backend errors. Preserve completed data. Distinguish empty states from failed requests.

## 25. Performance and Loading
Account for mobile-first loading, route-level loading states, lazy-loaded 3D/images, avoiding unnecessary client JS, and sensible query granularity. No premature caching infrastructure.

## 26. Accessibility
Accessible UI is still required alongside 3D. Provide text/accessible labels for controls, do not use color alone for info, support keyboard navigation, use semantic HTML, label inputs, show focus states, and ensure muscle/exposure data has non-3D textual representation.

## 27. Empty / Initial States
Gracefully handle zero workouts, no PR history, zero Training Exposure, and partially completed workouts without inventing fake user statistics.

## 28. Date and Time Handling
Store timestamps consistently in UTC. Present in the user's local timezone. Clearly define boundaries for 7D, 30D, 3M, etc.

## 29. Seed Data
Strategy: Deterministic, version-controlled seed/catalog data for the 3 exercises, required muscles, mappings, exposure factors, and 3D asset references.

## 30. Development Phasing
1. Project scaffold and foundations
2. Authentication + database foundation
3. Exercise/muscle catalog
4. Routine system
5. Active workout logging
6. History + domain calculations
7. Progress charts / PRs
8. Basic 3D exercise viewer infrastructure
9. 3D Body + muscle selection
10. Training Exposure ↔ Body integration
11. Polish, responsive behavior, accessibility, performance

## 31. Architecture Decision Record (ADR)
*   **Next.js App Router:** Provides a unified framework with built-in API routes and server components, removing the need for a separate backend service for a solo developer.
*   **Supabase:** Offers out-of-the-box Postgres, Auth, and RLS, eliminating complex backend boilerplate while remaining secure.
*   **Weights stored in kg:** Establishes a single, uncorrupted canonical format in the database.
*   **Analytics derived from raw data:** Prevents desync and allows formula updates (like Training Exposure) to retroactively apply to history without database migrations.
*   **Training Exposure not permanently stored:** It is a heuristic derived metric that should recalculate seamlessly if exercise-muscle mapping factors change in the future.
*   **Only 3 initial exercises:** Guarantees that the end-to-end product loop works perfectly without getting bogged down in data entry and massive asset pipelines.
*   **Lazy-loaded 3D assets:** Essential for mobile web performance; 3D models must not block the critical initial render or workout logging speed.
*   **No offline-first sync engine:** Introduces massive architectural complexity (CRDTs, conflict resolution) that is not justified for V1. Transient client state with reliable saves is sufficient.
