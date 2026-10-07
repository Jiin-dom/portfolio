/** Emil-aligned motion tokens — extend, don't fork. */
export const ease = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  drawer: [0.32, 0.72, 0, 1] as const,
};

export const duration = {
  press: 0.14,
  tooltip: 0.16,
  ui: 0.22,
  section: 0.55,
};
