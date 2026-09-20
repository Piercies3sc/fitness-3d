---
name: fitness-product-design
description: >-
  Governs all UI/UX, visual design, frontend layout, interaction design, information hierarchy, responsive behavior, and product-facing interface decisions for the fitness-3d project. Use this skill when making design decisions, creating UI elements, structuring layouts, or building frontend views.
---

# Fitness Product Design Guidelines

This skill governs all UI/UX, visual design, frontend layout, interaction design, information hierarchy, responsive behavior, and product-facing interface decisions for this project.

It must help prevent generic AI-generated design and ensure the application feels intentionally designed as a high-quality fitness/performance product.

## Product Context

This is a mobile-first responsive fitness web application.

Its central product loop is:

Learn the exercise
→ Perform the workout
→ Log the workout
→ See which muscles were trained
→ Understand personal progress

The product combines:
- interactive 3D exercise education
- workout logging
- exercise history
- strength/progress tracking
- interactive 3D anatomy
- muscle-specific training analysis
- connections between: Body → Muscle → Exercise → Personal Progress

The application is NOT intended to become an “everything fitness” application.
The UI must emphasize training, anatomy, movement, data, and progression.

## Design Character

The visual direction should feel:
- modern
- restrained
- premium
- athletic
- performance-oriented
- technical without looking clinical
- visually strong without being flashy

The interface should feel closer to a purpose-built sports/performance product than a generic startup dashboard.

Use:
- strong typography
- clear visual hierarchy
- intentional spacing
- useful data visualization
- large readable numeric performance data
- restrained use of color
- one intentional accent system
- high-quality 3D content as a meaningful visual element

The 3D body and 3D exercise viewer should be allowed to become the visual focus of screens where they are important.

## Anti-AI-Slop Rules

These rules are extremely important.
Never default to the visual language commonly produced by generic AI-generated SaaS interfaces.

**Avoid:**
- putting every piece of information inside a card
- endless rounded rectangles
- excessive rounded-xl / rounded-2xl containers
- random gradients
- purple-blue AI gradients
- unnecessary glow effects
- glassmorphism by default
- excessive shadows
- decorative blobs
- fake futuristic UI
- excessive badges
- excessive pills/chips
- icons beside every heading
- unnecessary icons where text is clearer
- giant empty hero sections
- startup landing-page patterns inside the application
- fake testimonials
- fake activity feeds
- fake statistics
- filler copy
- decorative charts with no informational value
- dashboards filled with unrelated widgets
- feature sections added just to fill space
- excessive animations
- unnecessary hover effects
- overly playful microinteractions
- copying default shadcn styling without adapting it
- using component-library defaults as the final visual design

Do not create visual complexity merely to make a page look “designed.”
Do not create UI elements unless they help the user understand something or perform an action.

## Product-Specific UX Principles

1. **Workout logging is a utility workflow.**
   During an active workout: `speed > decoration`.
   The user must be able to quickly see: exercise name, previous performance, set number, weight, reps, completion state, rest timer.
   Weight and rep inputs must be easy to use on a phone in a gym. Use large enough touch targets. Do not bury workout logging inside decorative UI.

2. **Exercise pages combine education and personal data.**
   The exercise page should connect: 3D movement demonstration → muscles involved → technique → user's history → progress.
   3D content must serve learning. It must not exist merely as decoration.

3. **The Body experience is a primary product feature.**
   Do not treat the 3D body as a small dashboard widget. When the Body screen is active, the anatomy model should receive appropriate visual priority.
   Users should be able to: rotate, zoom, inspect, select muscles, move from a muscle to related exercises, move from exercises back to personal progress.

4. **Progress should be contextual.**
   Exercise progress belongs primarily on exercise pages. Muscle training analysis belongs on Body / muscle pages. High-level summaries belong on Home. Do not create additional dashboards simply because data exists.

5. **Data must be understandable.**
   Numeric fitness data (e.g., 72.5 kg × 8, Estimated 1RM, weekly training exposure, PRs, volume) must have excellent legibility.
   Typography should help distinguish: primary numbers, labels, units, historical comparisons, supporting metadata.

6. **Mobile first does not mean mobile only.**
   Design the phone experience first. Desktop layouts should intelligently use additional space rather than simply stretching mobile cards across a wider screen.

7. **Avoid unnecessary cognitive load.**
   The user should not need to interpret fifteen metrics at once. Use progressive disclosure. Show the information most relevant to the current task.

## Design System Behavior

When a reusable design language is established, continue using it.
Do not redesign the application independently on every new screen.
Maintain consistency in: typography, spacing, borders, surface hierarchy, interactive states, chart styling, icon usage, buttons, inputs, sheets/dialogs, navigation, numeric formatting.
Prefer reusable primitives over one-off page styling. However, consistency must not mean wrapping every piece of information in the same generic Card component.

## Component Library Rule

Accessible primitives such as Radix may be used later.
Libraries such as shadcn may be referenced for behavior or primitives if useful.
**However**: Do NOT allow any external component library to dictate the product's visual identity. Library defaults are starting points, not the final design.

## 3D UX Rule

3D elements must always have a product purpose.
**GOOD**: rotate an exercise to inspect form, pause an animation, inspect muscle involvement, select a muscle on the anatomy model, connect anatomy to workout history.
**BAD**: spinning 3D objects used as decoration, unnecessary particle systems, flashy WebGL backgrounds, animations that compete with workout data.

## Content Rule

Do not invent: testimonials, fake users, fake social content, promotional statistics, meaningless fitness copy, motivational quotes, fake AI recommendations.
Placeholder data is allowed only when required for development/testing and must clearly behave as development data.

## Product Scope Rule

UI work must never silently expand product scope.
Do not add features such as: social feeds, followers, likes, comments, messaging, leaderboards, nutrition tracking, calorie databases, sleep tracking, step tracking, water tracking, AI coaching, AI workout generation, wearable integrations... unless explicitly requested later.

## Design Process

Before implementing or significantly changing any major screen, internally determine:
1. What is the user's primary task on this screen?
2. What information is essential to that task?
3. What should receive the strongest visual hierarchy?
4. Can anything be removed?
5. Is 3D useful on this screen or merely decorative?
6. Does the design follow the existing design system?
7. Does anything look like generic AI-generated SaaS UI?
8. Is the phone experience genuinely usable?
9. Does the desktop version make intelligent use of extra space?
10. Has any unrequested product feature been introduced?

If a design violates the anti-slop rules, revise it before considering the UI complete.

## Important Agent Behavior

This skill is a design constraint and decision framework. It must NOT independently redefine the product.
Product requirements will later live in `PRODUCT_SPEC.md`.
Technical architecture will later live in `ARCHITECTURE.md`.
The visual system will later be documented in `DESIGN_SYSTEM.md`.
Agent behavior will later be documented in `AGENTS.md`.
When those files exist, this skill must respect them rather than overriding them.
