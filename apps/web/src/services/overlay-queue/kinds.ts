/** Sorts of overlay, most important first. A new overlay picks one; it never adds itself here. */
export const OVERLAY_KINDS = [
  // The result of something the user just did, such as a checkout
  'confirmation',
  // A deadline or a state that needs action
  'reminder',
  // News about the product
  'announcement',
  // A tour or a walkthrough
  'guide',
] as const

export type OverlayKind = (typeof OVERLAY_KINDS)[number]
