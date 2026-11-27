export const PLANNING_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const PLANNING_MOTION_DURATION = 0.32;

export const PLANNING_MOTION_FAST_DURATION = 0.2;

export const PLANNING_MOTION_STAGGER = 0.05;

export const PLANNING_MOTION_SPRING = {
  type: "spring",
  stiffness: 220,
  damping: 24,
  mass: 0.9,
} as const;

export function getPlanningEnterTransition(delay = 0) {
  return {
    duration: PLANNING_MOTION_DURATION,
    delay,
    ease: PLANNING_MOTION_EASE,
  };
}
