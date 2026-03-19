# Animation Guidelines

This project should use animation to support clarity, not decoration. Motion should make layout changes feel smoother, reinforce hierarchy, and provide feedback for user actions without making the interface feel heavy.

## Principles

- Use motion to explain state changes, not to fill empty space.
- Keep most transitions short: 180ms to 320ms.
- Prefer small movement distances: 6px to 18px.
- Reserve scale effects for hover, selection, and compact emphasis.
- Avoid continuous or looping motion in data-heavy views.
- Animate groups and surfaces before animating individual text nodes.

## Preferred Patterns

- Section entrance: fade in with a slight vertical offset.
- Panel swap: quick fade and small slide when detail content changes.
- Lists: staggered entrance on first render and layout animation on filter or sort changes.
- Interactive cards: subtle lift on hover and a restrained press response.
- Numeric summaries: light fade or upward settle when the displayed value changes.

## Reduced Motion

- Always use reduced-motion support for new motion work.
- When reduced motion is enabled, keep opacity changes only or disable the animation entirely.
- Do not rely on animation for meaning. The interface should remain fully understandable without it.

## Data UI Rules

- Charts should not constantly reanimate during ordinary state updates.
- Prefer animating the chart container when switching views or periods instead of animating every datapoint.
- Avoid long spring animations in dashboards, especially in fixed-height layouts.
- Do not animate scroll position automatically unless the user triggered it.

## Framer Motion Conventions

- Use Framer Motion for client-side animation work.
- Centralize shared timing and easing tokens when a feature spans multiple components.
- Prefer `AnimatePresence` for view replacement and conditional panels.
- Prefer layout animation for sortable or filterable card lists.
- Keep easing consistent across a feature so the interface feels intentional.

## Current NetWorth Baseline

- The NetWorth tool uses subtle entrance motion for the main columns.
- Account cards have light hover and selection motion.
- Summary and detail panels animate when views or selected accounts change.
- Recent transactions reveal in a short stagger.

Future motion work in other tools should follow the same restraint level unless that tool has a clear reason to be more expressive.
