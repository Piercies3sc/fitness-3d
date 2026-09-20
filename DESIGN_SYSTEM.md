# Design System

## 1. Design Goal
The product must feel like an intentionally designed premium training and performance product. It is built around **MOVEMENT, TRAINING, ANATOMY, and PERFORMANCE DATA**.

**It must NOT look like:**
An AI-generated SaaS dashboard, a startup landing page, a generic Tailwind template, default shadcn, a cryptocurrency dashboard, a neon cyberpunk application, a gaming HUD, a medical application, or a bodybuilding content website.

**Desired Character:** Focused, athletic, restrained, technical, premium, confident, data-driven, modern, and highly usable.

## 2. Primary Visual Direction
**DARK-FIRST:** The V1 visual system uses a restrained dark mode as its base. (This is an intentional product direction, not permission to create glowing/neon UI).

**Base Palette:** Near-black/graphite background, slightly elevated charcoal surfaces, warm/off-white primary text, muted gray secondary text, and subtle borders.
**Primary Accent:** SIGNAL ORANGE / RED-ORANGE (Athletic and energetic, but not neon).

*Rules for Accent Use:* Use selectively for primary actions, active navigation, selected muscles, important interactive states, and meaningful graph emphasis. Do NOT flood entire screens with the accent. Do NOT use purple/blue AI gradients or decorative gradients.

## 3. Proposed Color Tokens
Use the following conceptual tokens (adjust slightly only if required for contrast/accessibility):

*   **`color-bg-base`**: `#0D0F10` (Background)
*   **`color-bg-elevated`**: `#131619` (Elevated background)
*   **`color-surface`**: `#181C1F` (Surface)
*   **`color-surface-high`**: `#1E2327` (Higher surface)
*   **`color-text-primary`**: `#F4F5F5` (Primary text)
*   **`color-text-secondary`**: `#A7ADB2` (Secondary text)
*   **`color-text-muted`**: `#727980` (Muted text)
*   **`color-border-subtle`**: `#292F34` (Subtle border)
*   **`color-border-strong`**: `#3A4147` (Strong border)
*   **`color-accent-primary`**: `~#FF5A36` (Primary accent)
*   **`color-accent-hover`**: (A controlled nearby variation of primary accent)
*   **`color-status-success`**: Restrained green (semantic positive only)
*   **`color-status-warning`**: Restrained amber
*   **`color-status-danger`**: Restrained red

*(Note: Do not use semantic green/red to judge whether a muscle was trained “well” or “badly”. Training Exposure is descriptive, not a quality score.)*

## 4. Training Exposure Color Behavior
Training exposure visually increases using a controlled, data-driven scale adjusting **opacity, brightness, saturation, and material intensity**.

*   **DO NOT** create a rainbow heatmap.
*   **DO NOT** map to green = good / red = bad. The visualization means `less exposure ↔ more exposure`.
*   **Selection State:** Muscle selection must remain distinguishable from exposure intensity (e.g., exposure controls base intensity; active selection receives a distinct accent outline or material emphasis).
*   **Accessibility:** Critical exposure information must always have a text representation outside the 3D model.

## 5. Typography
Use **ONE** primary modern sans-serif family (e.g., *Geist Sans*). Avoid decorative font pairing. Do NOT make the application look like a developer tool.

**Numerals:** Tabular numerals MUST be used for weights, repetitions, timers, Estimated 1RM, volume, and historical comparisons.

**Type Roles:**
Display, Page Title, Section Heading, Exercise Title, Body, Body Small, Label, Metadata, Large Numeric, Medium Numeric.

*(Rule: Avoid oversized marketing typography (e.g., giant 64-80px headlines) inside the authenticated application. Prioritize compact readability on workout screens.)*

## 6. Type Hierarchy Principle
Performance values must visually separate: **VALUE**, **UNIT**, and **CONTEXT**.
*Example:* `72.5 kg × 8`
*   `72.5`: Strongest emphasis.
*   `kg`: Visually subordinate.
*   `× 8`: Easily readable without competing with the weight value.
The metric label (e.g., "Estimated 1RM") should never overpower the actual numeric value.

## 7. Spacing System
Disciplined spacing scale based on a 4px/8px baseline: **4, 8, 12, 16, 20, 24, 32, 40, 48, 64**.
Do not use excessive whitespace as a shortcut for "premium". Premium feel comes from hierarchy, alignment, typography, and restraint. Workout logging screens must be physically more compact than educational screens.

## 8. Border Radius
Use restrained radius values. Do NOT default everything to `rounded-xl`, `rounded-2xl`, or `rounded-3xl`.
*   **Small controls:** 6–8px
*   **Inputs / Interactive elements:** 8–10px
*   **Meaningful contained surfaces:** 10–12px
*   **Large special panels:** ~14–16px maximum (when justified)
Circular controls only where functionally justified.

## 9. Surfaces & Cards
**Do not make every section a card.** Prefer hierarchy created through spacing, dividers, typography, alignment, and subtle surface shifts. Use contained cards only when content is genuinely a self-contained unit (e.g., compact routine entry, actionable exercise result, temporary workout summary).
*Bad:* Wrapping every heading/metric/chart separately, or nesting cards inside cards. Avoid excessive shadows; prefer borders and controlled contrast.

## 10. Iconography
Icons clarify actions; they are not decoration. Avoid an icon beside every heading.
*   **Style:** Consistent outlined icon style.
*   **Sizes:** 16px, 18px, 20px, 24px.
*   **Use Cases:** Play, pause, timer, edit, delete, reorder, back, search, filtering.
If text alone is clearer, use text. No emojis as permanent UI.

## 11. Navigation
*   **Mobile:** Compact bottom navigation (Home, Workout, Body, Exercises) with simple icon + short label. No unusually tall or floating glassmorphism bars. Active state is obvious but restrained. (During active workouts, task controls may take priority over main navigation).
*   **Desktop:** Compact left rail/sidebar. Do not stretch the bottom navigation. Keep it restrained without dozens of nested admin-dashboard links.

## 12. Screen Design Principles

### Home Screen
Structured hierarchy (Next Workout, Short Training Summary, Body Snapshot, Recent Progress). NOT a dashboard grid of twelve cards. No fake AI insights, social activity, or irrelevant wellness metrics.

### Active Workout
**FAST ENTRY > VISUAL DECORATION.** Optimized for 390px phone width, one-handed gym use.
*   Clear rows: SET, PREVIOUS, WEIGHT, REPS, COMPLETE.
*   Generous touch targets (min 44×44px).
*   Use numeric keyboard behavior.
*   Completed sets must be visually obvious. Distinguish warmup/working sets without color noise.
*   Compact, structured table-like rhythm. No giant individual cards for every set.

### Workout Feedback
Restrained, satisfying PR feedback (e.g., concise highlight: `NEW ESTIMATED 1RM PR 92.4 kg`). NO confetti, shaking UI, full-screen trophies, or gamified XP.

### Exercise Library & Detail
*   **Library:** Designed for exactly 3 exercises in V1. No massive search/filter dominance.
*   **Detail:** 3D viewer is visually important (not in a tiny card). Minimal controls (play/pause/speed). Desktop allows parallel content; mobile prioritizes vertical scrolling below the model.

### 3D Body & Muscle Detail
*   **Body Screen:** Immersive but functional. Mobile: Large viewport model, lightweight top controls, selected info in bottom sheet. Desktop: Large anatomy area, side panel for info. No decorative scene objects.
*   **Controls:** Compact time (7D, 30D...) and mode (TRAINING vs PROGRESS) controls. Don't turn every option into a massive pill.
*   **Muscle Selection:** Controlled transition, selected anatomy gets focus, unrelated anatomy quiets down. Muscle text identifier always visible.
*   **Muscle Detail:** Focused on "What?", "How much?", "How often?", "When last?". No 20-metric dashboards or fake physiological scores.

## 13. Data Density
*   **Active Workout:** High practical density.
*   **Home:** Medium density.
*   **Exercise Education:** Medium/low density (room for 3D).
*   **Body:** 3D-dominant.
*   **Progress History:** Medium analytical density.
Do not force one universal card layout onto every screen.

## 14. Components & Interactive Elements
*   **Buttons:** Hierarchy: PRIMARY, SECONDARY, GHOST, DESTRUCTIVE. Avoid gradients, glowing borders, or exaggerated shadows. Solid, functional feel.
*   **Inputs:** Visible focus state, clear selected state, strong contrast. Numeric inputs prioritize the number itself. Errors appear near input without shifting UI wildly.
*   **Dialogs / Sheets:** Mobile: Bottom sheets for contextual interactions. Desktop: Standard dialogs/panels. Avoid glassmorphism.
*   **Charts:** Restrained Recharts. Simple lines/bars, subtle grids, high legibility, neutral comparisons, one dominant accent. NO 3D charts, unnecessary donuts, area gradients, or animated distractions. Override Recharts defaults.

## 15. Motion & States
*   **Motion:** 120–200ms standard UI transitions. Slightly longer for spatial context (muscle select, 3D camera). NO bouncy spring animations, scroll-jacking, or ambient floating UI. Respect reduced-motion.
*   **Loading:** Calm, subtle skeletons or restrained progress. Clear lightweight loading state for 3D. No giant branded loading animations.
*   **Empty States:** Honest and actionable (e.g., "No workouts yet. Start a workout."). No fake charts or statistics to fill space.
*   **Error States:** Concise, actionable, human-readable. No raw backend messages or dramatic red full-screen alerts for minor issues.

## 16. Accessibility
Sufficient contrast, visible focus states, semantic HTML/labels, minimum touch targets. **Critical requirement:** 3D interactions must never be the only way to access critical training information. Provide text alternatives.

## 17. Responsive Behavior
Phone-first (~390px reference). Desktop (~1280px+) adds useful parallel information, stronger split layouts, and more room for 3D—NOT just stretching UI or adding gigantic whitespace. Use sensible max-widths for text-heavy content.

## 18. 3D Scene Visual Design
Scenes belong to the application. Restrained neutral backgrounds. Lighting clearly exposes form/anatomy. **Avoid:** Cinematic colored lights, neon rim lights, particles, fog, distracting reflections, excessive bloom. Keep UI overlays minimal and readable over varying model positions (no game HUD aesthetics).

## 19. Numeric Formatting & Copy Style
*   **Formatting:** `72.5 kg`, `1,635 kg`, `48.2 equivalent sets`. Round appropriately; avoid meaningless decimal precision.
*   **Copy:** Concise, direct, neutral, practical. (e.g., "Start Workout", "Estimated 1RM"). **Avoid:** Startup marketing language, bro-gym hype ("Unlock Beast Mode!"), medical claims, or AI-generated filler.

## 20. Component Principle & Shadcn Rule
Do not prematurely define dozens of theoretical components. Build them as patterns emerge during implementation.
**Shadcn/Radix Rule:** These primitives may be used for behavior/accessibility, but they MUST NOT determine the final visual appearance. Never use default shadcn aesthetics merely because they are convenient. Restyle everything to match this design system.

## 21. Design Review Checklist
Implementation agents must answer these questions before considering a major screen complete:
1. What is the primary task?
2. Is that task visually obvious?
3. Can anything unnecessary be removed?
4. Is this screen using too many cards?
5. Are there unnecessary pills/badges/icons?
6. Is color communicating something real?
7. Is the 3D element useful or decorative?
8. Is mobile usage genuinely comfortable?
9. Is data hierarchy clear?
10. Does this resemble a generic AI SaaS interface?
11. Did the screen invent any new product feature?
12. Does desktop intelligently use additional room?
13. Are loading/empty/error states accounted for?
14. Is critical information accessible without relying solely on color or 3D?

*(If the answer reveals AI-slop or unnecessary complexity, revise before considering the design complete.)*

## 22. Visual Polish Patterns

The global polish pass uses a small shared vocabulary rather than a component-library overhaul:

* **Page shell:** Mobile-first horizontal padding, a restrained maximum reading width, and a ruled page header.
* **Headers:** Back navigation, an optional small uppercase context label, one strong page title, and one concise supporting sentence.
* **Surfaces:** Use a bordered charcoal surface only for contained tasks, model viewports, dialogs, and primary actions. Prefer horizontal dividers and section rails for chronological lists, metrics, and supporting information.
* **Actions:** Signal orange is reserved for the single primary action in a local context. Elevated bordered controls are secondary; text actions are tertiary; destructive actions remain neutral until hovered.
* **Metrics:** Use tabular numerals with a small uppercase label and dividers between related values. Do not put every metric in an individual card.
* **Fields:** Inputs and numeric controls use a 44px practical touch height, restrained 8px radius, a subtle accent focus ring, and a local error treatment.

These patterns preserve the existing dark palette and approved Body Training Exposure colors. They are visual conventions only; they must not change domain behavior or existing interaction contracts.
