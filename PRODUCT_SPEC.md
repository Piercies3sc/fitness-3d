# Product Specification

## 1. Product Vision

This is a personal, mobile-first responsive fitness web application. The goal is NOT to build an application that does everything related to fitness.

The core product idea is to connect:
`3D exercise learning → workout execution → workout logging → muscle training visualization → personal performance progress`

The central user loop is:
**LEARN → TRAIN → LOG → SEE WHAT YOU TRAINED → UNDERSTAND HOW YOU PROGRESSED**

A concise conceptual description is: "Learn the movement. Train it. Log it. See what you trained. Understand how you changed."

The product should feel like a connected training system rather than a generic workout tracker, nutrition application, social fitness network, AI coach, or bodybuilding content platform. The distinguishing concept is the connection between: **3D Anatomy ↔ Muscle ↔ Exercise ↔ Workout History ↔ Personal Progress**.

## 2. Product Principles

1. **3D must be functional, not decorative.** The user should use 3D to learn exercise movement, rotate and inspect movement, understand involved muscles, explore anatomy, and inspect personal muscle training data.
2. **Workout logging must remain fast.** During a workout: `speed > visual effects`.
3. **Personal progress should appear in context.** Exercise performance belongs on the exercise page. Muscle training analysis belongs on Body / Muscle pages. High-level summaries belong on Home.
4. **Do not add features simply because competing fitness apps contain them.**
5. **Do not attempt to compete with mature nutrition, social, or coaching products in V1.**
6. **Start with a small number of extremely well-integrated exercises** rather than a large mediocre exercise library.
7. **Fitness estimates must be clearly presented as estimates.**
8. **Avoid false physiological precision.**
9. **Natural Navigation.** The user should be able to move naturally between: `Body → Muscle → Exercise → Personal Progress` and back again.

## 3. Target Platform

**V1 is a mobile-first responsive WEB APPLICATION.**
It is NOT initially a native iOS or Android app. The phone experience is especially important because workout logging will usually happen in the gym. Desktop should also provide a high-quality experience, especially for inspecting 3D anatomy, exploring exercises, reviewing progress, and viewing historical data.

## 4. V1 Exercises

The first real prototype intentionally contains only THREE exercises:
1. Bench Press (Upper-body push)
2. Squat (Lower-body)
3. Lat Pulldown (Upper-body pull)

The complete product loop must work well with these three exercises before any expansion. Future exercises (e.g., Deadlift, Pull-up, Row) must not be implemented as part of the initial prototype unless explicitly requested later.

## 5. Primary Navigation

The main application navigation contains four primary areas:
- **HOME**
- **WORKOUT**
- **BODY**
- **EXERCISES**

*(Note: Do NOT create a separate generic "Progress Dashboard" as a primary navigation item in V1. Progress should primarily live where it is meaningful.)*

## 6. Home

**Purpose:** Give the user a concise overview of what matters now.

Home may contain:
- **Next / Today's Workout:** A quick start for routines (e.g., "Push Day" with a list of exercises and a "Start Workout" button).
- **Week Summary:** Workouts completed, working sets, workout volume.
- **Body / Training Snapshot:** A concise summary of recent training exposure.
- **Recent Progress:** Recent exercise improvement, new PR, useful recent performance change.

Home must NOT become a widget-heavy analytics dashboard (no calories, steps, water, sleep, etc.).

## 7. Workout Area

Contains at minimum: **ROUTINES** and **HISTORY**.
Users can:
- Create and name a routine.
- Add and reorder exercises.
- Define planned sets / rep targets where appropriate.
- Start a workout from a routine.
- Review historical workouts.

Do not implement unrequested automated workout generation.

## 8. Active Workout Experience

This is a utility-focused screen. The user must be able to quickly see:
- Workout name, elapsed time, exercise name, previous performance, set number, weight, repetitions, completion state, and a rest timer.

The user can complete/add sets, edit weight/reps, and continue to the next exercise. After completing a working set, a rest timer may start automatically, and meaningful (but restrained) PR feedback may be shown. A compact "Exercise / Technique" action may allow the user to inspect the exercise without losing workout state.

## 9. Set Types

V1 distinguishes at minimum: **WARM-UP SET** and **WORKING SET**.
Training Exposure calculations use **WORKING SETS ONLY**. Warm-up sets do not contribute to Training Exposure. Do NOT require RPE or RIR in V1.

## 10. Workout Completion

When the user finishes a workout, show a useful summary including duration, working sets, total volume, new PRs, and meaningful exercise progress. The summary should also show **MUSCLES TRAINED** using the Training Exposure system, potentially featuring a small 3D body visualization.

The important transition is: `WORKOUT COMPLETE → VIEW MY BODY`.

## 11. Exercise Library & Detail

The library allows browsing/searching exercises. Each exercise has a dedicated Exercise Detail page combining **3D EDUCATION** and **PERSONAL PERFORMANCE**.

- **3D Interactive Demonstration:** Play, pause, playback speed, rotate, zoom, reset view.
- **Learn:** Muscles involved, setup, execution, technique, common mistakes.
- **My Progress:** Recent/current performance, exercise history, estimated 1RM, PRs, historical charts.

Muscle names should link to the corresponding Muscle / Body experience.

## 12. 3D Body & Muscle Detail

The Body experience is a defining feature, not a decorative avatar. The user should be able to rotate, zoom, inspect, select a muscle, see training data, and move to related exercises.

**Training Exposure:** The primary V1 Body metric. It answers "Which muscles have I trained, and approximately how much?". It does NOT claim to measure muscle size, growth, hypertrophy, recovery, or exact biological stimulus.

When a muscle is selected, show a focused detail experience for a selected time range (e.g., 30 Days) showing Training Exposure (equivalent sets), weekly average, sessions, last trained, and top contributing exercises. Muscle progress should be explained through individual exercise performance, not fake aggregate values.

## 13. Application-Specific Calculations

### Training Exposure
An application-specific estimate calculated using working sets mapped to muscles with an involvement factor.
*Initial Mappings (Configurable later):*
- **Bench Press:** Pectoralis Major (Primary, 1.00), Triceps (Secondary, 0.50), Anterior Deltoid (Secondary, 0.40).
- **Squat:** Quadriceps (Primary, 1.00), Glutes (Primary, 0.80), Adductors (Secondary, 0.40), Hamstrings (Secondary, 0.25).
- **Lat Pulldown:** Latissimus Dorsi (Primary, 1.00), Biceps (Secondary, 0.50), Teres Major (Secondary, 0.40), Mid/Lower Trapezius (Secondary, 0.25).

*Note: These factors are initial product assumptions, not exact biological contributions.*

### Estimated 1RM
Formula (Epley): `Estimated 1RM = weight × (1 + reps / 30)`.
Always label as "Estimated 1RM". Do not present a formula-derived value as an actual performed 1RM.

### Volume
Calculated from completed sets: `weight × reps` summed across applicable sets.
Volume belongs to exercise and workout analysis, NOT muscle analysis.

### Personal Records
Recognized categories: Weight PR, Rep PR, Estimated 1RM PR, Volume PR.

## 14. "Then vs Now" & Body Modes

- **Then vs Now:** Compare early and current performance to communicate real historical progress without exaggerated gamification.
- **Body Modes:** Conceptually structure the Body experience into **TRAINING** ("What have I trained?") and **PROGRESS** ("How are the exercises associated with this area progressing?").

## 15. Onboarding & Guest Experience

- **Onboarding:** Lightweight. Do not ask for personal information unless needed. Flow: Explore → Inspect Exercise/3D → Create Account → Create Routine → Workout → View Muscles → Open My Body. First "aha" moment is seeing a completed workout reflected on the 3D Body.
- **Guest Experience:** Allow non-authenticated users to explore the Exercise Library, 3D demos, and generic anatomy. Authentication is required for saving workouts, history, progress, PRs, and personal Training Exposure.
- **First-Run Data:** Basic unit preference (kg/lb). Avoid asking for age, height, sex, body fat, etc., in V1.

## 16. Core V1 Feature Set

- Authentication, user account, basic unit preference.
- Home, routine creation, routine editing.
- Starting a workout, active workout logging (weight/reps/sets, warm-up vs working sets, rest timer).
- Workout history, workout completion summary.
- Exercise history, personal records, estimated 1RM, exercise progress visualization.
- Three initial exercises with high-quality 3D support.
- Interactive 3D anatomy Body, muscle selection, exercise ↔ muscle mapping.
- Training Exposure calculation, time-range-based muscle analysis, muscle detail.
- Body → Muscle → Exercise navigation and vice versa.
- Connection between personal workout data and 3D Body visualization.
- Mobile-first responsive experience.

## 17. Explicitly Out of Scope for V1

Do not build: Nutrition tracking, calorie/macro tracking, food database, barcode scanning, recipes, social feed, followers, likes, comments, messaging, leaderboards, friend system, community features, AI coach, AI workout generation, chatbot, pose/form recognition, camera-based form analysis, sleep tracking, step counting, hydration tracking, wearable integrations, Apple Health / Google Fit integrations, subscription/payments, creator/program marketplaces, hundreds of exercises, or native mobile applications.

## 18. Future Possibilities (Not Commitments, NOT V1)

Potential future ideas (NOT part of current V1):
- Additional exercises
- Richer exercise technique education
- Optional nutrition/performance context
- Body weight vs performance relationships
- Richer comparison timelines
- Additional muscle/anatomy layers
- Skeleton/muscle view modes
- More sophisticated training insights
- Optional sharing of progress cards

## 19. Product Success Criterion

The product concept is successful if this loop is coherent and compelling:
User opens Bench Press → inspects in 3D → understands muscles → adds to routine → starts workout → records working sets → completes workout → sees Chest/Triceps/Front Deltoid Training Exposure → opens Chest on 3D Body → navigates back to Bench Press → sees personal Bench Press history and progress.
