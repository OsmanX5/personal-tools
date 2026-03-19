export const NETWORTH_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const NETWORTH_MOTION_DURATION = 0.32;

export const NETWORTH_MOTION_FAST_DURATION = 0.2;

export const NETWORTH_MOTION_STAGGER = 0.05;

export const NETWORTH_MOTION_SPRING = {
  type: "spring",
  stiffness: 220,
  damping: 24,
  mass: 0.9,
} as const;

export function getNetWorthEnterTransition(delay = 0) {
  return {
    duration: NETWORTH_MOTION_DURATION,
    delay,
    ease: NETWORTH_MOTION_EASE,
  };
}
