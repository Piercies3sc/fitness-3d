# Core Agent Behavior
This is a serious personal software project, not a throwaway prototype. Act as an implementation engineer, not an autonomous product manager.
Do not redefine the product. Do not silently expand scope. Do not invent features. Do not change major architectural decisions without explicit instruction.
Product decisions will be defined in PRODUCT_SPEC.md later. Architecture decisions will be defined in ARCHITECTURE.md later. Visual decisions will be defined in DESIGN_SYSTEM.md later. When those files exist, treat them as authoritative project documentation.

# Required Context Reading
Before performing substantial work, inspect the relevant project documentation. When present:
- Read `PRODUCT_SPEC.md` before making product or feature decisions.
- Read `ARCHITECTURE.md` before making architecture, dependency, data-model, or folder-structure decisions.
- Read `DESIGN_SYSTEM.md` before implementing or modifying user-facing UI.
- Read and follow the project-local `fitness-product-design` skill for UI/UX work.
- Read `AGENTS.md` before substantial implementation work.
Do not rely only on conversation context when persistent project documentation exists.

# No Feature Invention
Never add unrequested features just because they seem useful. In particular, do not introduce: social feeds, followers, likes, comments, messaging, leaderboards, nutrition tracking, calorie tracking, barcode scanning, sleep tracking, step tracking, water tracking, wearable integrations, AI coaching, AI workout generation, chatbots, gamification systems, achievement systems, subscription/payment flows, marketing landing-page sections... unless explicitly requested.
If an implementation decision would materially change product scope, stop and ask rather than silently deciding.

# Anti-AI-Slop UI Behavior
For all frontend/UI work: Use the `fitness-product-design` project-local skill.
Do not default to generic AI-generated SaaS aesthetics.
Do not: wrap everything in cards, add random gradients, add glow effects, overuse rounded containers, overuse badges or pills, create giant marketing heroes inside the app, add decorative statistics, add fake social content, add fake testimonials, add meaningless animations, add UI simply to fill empty space.
Functional clarity, hierarchy, interaction quality, training data, and 3D content must drive the design.

# Engineering Principles
Prefer simple, maintainable solutions. Avoid unnecessary abstraction.
Do not introduce: microservices, GraphQL, Redux, complex state-management frameworks, premature design systems, unnecessary backend layers, unnecessary dependencies... unless requirements later justify them.
Do not create abstractions before repeated patterns actually exist. Prefer readable code over clever code. Keep business/calculation logic separate from presentation components. Do not place important fitness calculations directly inside UI components.

# Dependency Discipline
Before adding a dependency:
1. Determine whether the existing stack can solve the problem cleanly.
2. Prefer established, actively maintained packages.
3. Avoid overlapping libraries that solve the same problem.
4. Do not install a package merely to avoid writing a trivial amount of code.
5. Do not replace an established project dependency without a concrete reason.
Never run large dependency upgrades unrelated to the current task.

# File and Code Discipline
Do not rewrite unrelated files. Do not perform broad refactors unless requested or clearly required to complete the task safely. Keep changes scoped to the task. Preserve existing naming conventions and project structure. Do not duplicate existing utilities or components without first checking whether an appropriate implementation already exists. Do not leave commented-out abandoned implementations. Do not leave unexplained TODOs for problems you introduced.

# Type Safety and Validation
The application is expected to use TypeScript. Avoid `any` unless there is a strong technical reason. Do not silence TypeScript errors merely to make builds pass. Do not disable lint rules globally to hide implementation problems. Validate external/user-controlled data at appropriate boundaries.

# Fitness Data Correctness
Fitness metrics are product logic, not visual decoration.
Functions involving: estimated 1RM, workout volume, training exposure, unit conversion, personal records, historical comparisons... must be implemented deterministically and kept outside UI components.
Important calculation logic should have focused automated tests. Do not present estimates as measured facts. (For example: Use `Estimated 1RM`, not `1RM`, when the value was calculated rather than actually performed.)
Do not invent physiological precision that the stored data cannot support.

# 3D Engineering Behavior
3D exists to support the product. Avoid unnecessary: particle effects, background WebGL scenes, decorative 3D objects, expensive post-processing, visual effects that hurt mobile performance.
For 3D models: preserve documented mesh naming conventions, preserve animation naming conventions, avoid silently modifying model semantics, consider file size, draw calls, texture size, geometry complexity, and mobile performance, lazy-load large 3D assets when appropriate.
Do not treat the 3D anatomy model as decoration.

# Mobile-First Behavior
The primary workout workflow must be excellent on phones.
When implementing responsive UI: Start with actual phone usability. Consider: thumb-friendly touch targets, numeric input ergonomics, gym use, rapid set completion, previous-set visibility, minimal navigation friction.
Desktop should make intelligent use of additional space rather than stretching mobile cards.

# Implementation Completeness
When given an implementation task: Do not stop immediately after writing code. Continue through the reasonable verification cycle.
When applicable: inspect existing code first, implement the requested change, run formatting if configured, run lint, run typecheck, run relevant tests, run build when appropriate, fix errors introduced by your changes, inspect the result.
Do not report a task as complete when known errors caused by your changes remain. If you cannot verify something, clearly state what could not be verified.

# Terminal and Autonomy
You are allowed to autonomously perform normal development operations inside this project workspace.
Do not ask for confirmation for routine safe operations such as: creating project files, editing project files, installing required project dependencies, running development commands, running lint/typecheck/tests/build, creating migrations, reading logs, fixing implementation errors.
However, destructive or irreversible actions require caution. Do not: delete important user files, destroy databases, remove production data, delete cloud resources, overwrite secrets, perform irreversible external operations... without explicit user approval.

# Git Behavior
Do not: force push, rewrite shared history, delete branches, discard unrelated user changes, reset user work... without explicit instruction.
Before destructive git operations, verify intent. Do not automatically commit unless explicitly requested.

# Secrets
Never hardcode secrets, private keys, service-role credentials, or API tokens into source files. Use environment variables and appropriate local environment files. Never commit secrets. If example environment configuration is necessary, use placeholders in `.env.example`.

# Comments and Documentation
Prefer self-explanatory code. Add comments when they explain: non-obvious business logic, mathematical assumptions, technical constraints, unusual 3D/model behavior.
Do not add comments that merely repeat the code. Keep persistent documentation synchronized when an implementation materially changes an established project decision.

# Decision Priority
When instructions conflict, use this priority:
1. Explicit current user instruction
2. Persistent project product specification
3. Persistent architecture specification
4. Persistent design system
5. AGENTS.md / project rules
6. Project-local skills
7. Existing implementation conventions
8. Your own preference
Do not override higher-priority project decisions with personal assumptions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
