# Home Animation Package V1 Plan

This document establishes the authoritative planning specification for the first 3D exercise animation package for **fitness-3d**.

In accordance with the **home-workout-first** product direction, this initial animation package focuses strictly and exclusively on **30 home-friendly movements** spanning all 10 anatomical body regions (3 movements per region).

> [!NOTE]
> This is a planning and asset specification document only. Animation assets (.glb) will be authored in Blender and supplied manually in a future phase. No placeholder or fake 3D animation assets are introduced at this time.

---

## 30 Prioritized Home-Friendly Movements

### CHEST
1. **Push-Up** (`push-up`) — Bodyweight
2. **Incline Push-Up** (`incline-push-up`) — Bodyweight + Bench/Chair
3. **Dumbbell Floor Press** (`dumbbell-floor-press`) — Dumbbells

### BACK
4. **One-Arm Dumbbell Row** (`one-arm-dumbbell-row`) — Dumbbell + Bench
5. **Resistance Band Row** (`resistance-band-row`) — Resistance Band
6. **Superman** (`superman`) — Bodyweight

### SHOULDERS
7. **Pike Push-Up** (`pike-push-up`) — Bodyweight
8. **Dumbbell Shoulder Press** (`dumbbell-shoulder-press`) — Dumbbells + Bench
9. **Dumbbell Lateral Raise** (`dumbbell-lateral-raise`) — Dumbbells

### BICEPS
10. **Dumbbell Biceps Curl** (`dumbbell-biceps-curl`) — Dumbbells
11. **Hammer Curl** (`hammer-curl`) — Dumbbells
12. **Resistance Band Biceps Curl** (`resistance-band-biceps-curl`) — Resistance Band

### TRICEPS
13. **Close-Grip Push-Up** (`close-grip-push-up`) — Bodyweight
14. **Chair Dip** (`chair-dip`) — Bodyweight + Chair/Bench
15. **Dumbbell Overhead Triceps Extension** (`dumbbell-overhead-triceps-extension`) — Dumbbell

### QUADRICEPS
16. **Bodyweight Squat** (`bodyweight-squat`) — Bodyweight
17. **Reverse Lunge** (`reverse-lunge`) — Bodyweight / Dumbbells
18. **Bulgarian Split Squat** (`bulgarian-split-squat`) — Dumbbells + Bench

### HAMSTRINGS
19. **Dumbbell Romanian Deadlift** (`dumbbell-romanian-deadlift`) — Dumbbells
20. **Single-Leg Romanian Deadlift** (`single-leg-romanian-deadlift`) — Dumbbell / Bodyweight
21. **Sliding Leg Curl** (`sliding-leg-curl`) — Sliders/Towel

### GLUTES
22. **Glute Bridge** (`glute-bridge`) — Bodyweight
23. **Single-Leg Glute Bridge** (`single-leg-glute-bridge`) — Bodyweight
24. **Donkey Kick** (`donkey-kick`) — Bodyweight

### CALVES
25. **Standing Calf Raise** (`standing-calf-raise`) — Calf Raise Machine / Bodyweight
26. **Single-Leg Calf Raise** (`single-leg-calf-raise`) — Bodyweight
27. **Seated Calf Raise** (`seated-calf-raise`) — Seated Calf Machine / Dumbbells

### CORE
28. **Plank** (`plank`) — Bodyweight / Mat
29. **Side Plank** (`side-plank`) — Bodyweight
30. **Dead Bug** (`dead-bug`) — Bodyweight

---

## Technical Guidelines for Future Animation Authoring
- Preserve existing exercise slugs when naming animation tracks (e.g. `exercise__push_up`).
- Retain anatomical coordinate alignment established by the base human model.
- Keep animation clip lengths disciplined (looping 2–4 second repetitions).
- Avoid decorative physics or particle systems.
