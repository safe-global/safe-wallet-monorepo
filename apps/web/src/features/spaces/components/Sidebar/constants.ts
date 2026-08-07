export const SPACE_SELECTOR_NAME_MAX_LENGTH = 15

export const containerVariants = Object.freeze({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
} as const)

export const itemVariants = Object.freeze({
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
} as const)
