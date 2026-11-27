export const COURSES_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const COURSES_MOTION_DURATION = 0.28;

export const COURSES_MOTION_FAST_DURATION = 0.18;

export const COURSES_MOTION_STAGGER = 0.06;

export const coursesSectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: COURSES_MOTION_DURATION,
      delay: i * COURSES_MOTION_STAGGER,
      ease: COURSES_MOTION_EASE,
    },
  }),
  exit: {
    opacity: 0,
    y: 6,
    transition: {
      duration: COURSES_MOTION_FAST_DURATION,
      ease: COURSES_MOTION_EASE,
    },
  },
};

export const coursesWishlistItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: COURSES_MOTION_DURATION,
      delay: i * COURSES_MOTION_STAGGER,
      ease: COURSES_MOTION_EASE,
    },
  }),
  exit: {
    opacity: 0,
    x: -8,
    transition: {
      duration: COURSES_MOTION_FAST_DURATION,
      ease: COURSES_MOTION_EASE,
    },
  },
};

export const coursesFilterChipVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: COURSES_MOTION_FAST_DURATION,
      ease: COURSES_MOTION_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: COURSES_MOTION_FAST_DURATION,
      ease: COURSES_MOTION_EASE,
    },
  },
};
