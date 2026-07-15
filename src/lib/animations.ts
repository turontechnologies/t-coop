export const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * index,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};
