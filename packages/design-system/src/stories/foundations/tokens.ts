/**
 * The token inventory the Foundations stories render.
 *
 * Kept as data rather than hard-coded swatches so a new token shows up in the gallery by being
 * added here, and so the "every semantic token resolves in both themes" check has one list to
 * walk. Values are read from the live CSS at render time — this file names tokens, it does not
 * duplicate their values. A hard-coded hex here would be a second source of truth, which is the
 * exact problem the design system exists to remove.
 */

export type TokenGroup = {
  title: string
  /** What this group is for, in the terms a designer would use when choosing from it. */
  blurb: string
  tokens: { name: string; use: string }[]
}

/** Semantic surface + ink tokens, scoped to `.shadcn-scope`. */
export const SEMANTIC_GROUPS: TokenGroup[] = [
  {
    title: 'Page & surfaces',
    blurb:
      'The stack a component sits on. `background` is the page floor, `card` the raised panel, `dialog` the modal surface, `surface-sunken` a well inside a card.',
    tokens: [
      { name: '--color-background', use: 'Page floor' },
      { name: '--color-foreground', use: 'Default ink on the page' },
      { name: '--color-card', use: 'Raised panel' },
      { name: '--color-card-foreground', use: 'Ink on a card' },
      { name: '--color-popover', use: 'Popover / dropdown surface' },
      { name: '--color-popover-foreground', use: 'Ink on a popover' },
      { name: '--color-dialog', use: 'Modal surface' },
      { name: '--color-backdrop', use: 'Scrim behind a modal' },
      { name: '--color-surface-sunken', use: 'Well inside a card (nested rows)' },
    ],
  },
  {
    title: 'Emphasis',
    blurb:
      'Button and control emphasis. One filled `primary` per surface; `secondary` is filled but only reads on white/card surfaces; `muted` is the quiet fill.',
    tokens: [
      { name: '--color-primary', use: 'The one filled primary action' },
      { name: '--color-primary-foreground', use: 'Ink on primary' },
      { name: '--color-secondary', use: 'Filled secondary — card/white surfaces only' },
      { name: '--color-secondary-foreground', use: 'Ink on secondary' },
      { name: '--color-secondary-hover', use: 'Secondary hover fill' },
      { name: '--color-muted', use: 'Quiet fill (ghost hover, disabled)' },
      { name: '--color-muted-foreground', use: 'Secondary / caption ink' },
      { name: '--color-accent', use: 'Selected / active tint' },
      { name: '--color-accent-foreground', use: 'Ink on the accent tint' },
      { name: '--color-accent-secondary', use: 'Brand mint tint' },
      { name: '--color-accent-success', use: 'Positive accent' },
    ],
  },
  {
    title: 'Lines & fields',
    blurb:
      '`border` is the visible hairline. `input` is the **field fill**, not a border colour — a visible field or button edge uses `border-border`, never `border-input`.',
    tokens: [
      { name: '--color-border', use: 'Visible hairline — the default edge' },
      { name: '--color-input', use: 'Field FILL (#fff light / 5% white dark)' },
      { name: '--color-ring', use: 'Focus ring' },
    ],
  },
  {
    title: 'Status',
    blurb:
      'Each status has a `subtle` tint surface, a `muted` mid tone, and a `strong` ink that clears AA on its own tint. `destructive` is the one destructive style.',
    tokens: [
      { name: '--color-destructive', use: 'Destructive action / error accent' },
      { name: '--color-error-subtle', use: 'Error tint surface' },
      { name: '--color-error-strong', use: 'Error ink on its tint' },
      { name: '--color-warning-subtle', use: 'Warning tint surface' },
      { name: '--color-warning-muted', use: 'Warning mid tone' },
      { name: '--color-warning-strong', use: 'Warning ink on its tint' },
      { name: '--color-warning-accent', use: 'Warning icon accent' },
      { name: '--color-success-subtle', use: 'Success tint surface' },
      { name: '--color-success-muted', use: 'Success mid tone' },
      { name: '--color-success-strong', use: 'Success ink on its tint' },
      { name: '--color-info-subtle', use: 'Info tint surface' },
      { name: '--color-info-muted', use: 'Info mid tone' },
      { name: '--color-info-strong', use: 'Info ink on its tint' },
    ],
  },
  {
    title: 'Sidebar',
    blurb:
      'The sidebar reads as a distinct white panel in light mode and blends into the page in dark mode, so it carries its own set rather than reusing the card tokens.',
    tokens: [
      { name: '--color-sidebar', use: 'Sidebar surface' },
      { name: '--color-sidebar-foreground', use: 'Sidebar ink' },
      { name: '--color-sidebar-primary', use: 'Sidebar primary' },
      { name: '--color-sidebar-primary-foreground', use: 'Ink on sidebar primary' },
      { name: '--color-sidebar-accent', use: 'Selected nav item' },
      { name: '--color-sidebar-accent-foreground', use: 'Ink on a selected nav item' },
      { name: '--color-sidebar-border', use: 'Sidebar hairline' },
      { name: '--color-sidebar-ring', use: 'Sidebar focus ring' },
    ],
  },
  {
    title: 'Charts',
    blurb: 'The ordered categorical ramp. Use in sequence — chart-1 first — so series colours stay consistent.',
    tokens: [1, 2, 3, 4, 5].map((n) => ({ name: `--color-chart-${n}`, use: `Series ${n}` })),
  },
]

/** Radius scale, mapped onto Tailwind's `rounded-*` utilities. */
export const RADIUS_TOKENS = [
  { name: '--radius-2xs', utility: 'rounded-2xs' },
  { name: '--radius-xs', utility: 'rounded-xs' },
  { name: '--radius-sm', utility: 'rounded-sm' },
  { name: '--radius-md', utility: 'rounded-md' },
  { name: '--radius-lg', utility: 'rounded-lg' },
  { name: '--radius-xl', utility: 'rounded-xl' },
  { name: '--radius-2xl', utility: 'rounded-2xl' },
  { name: '--radius-infinite', utility: 'rounded-full' },
]

/**
 * Overlay stacking order. These are not decorative: a wrong value means an overlay opened from
 * inside another one renders behind it. `--z-above-onboard` must beat onboard.css's wallet modal
 * (1450), which apps/web asserts in walletModalZIndex.test.ts.
 */
export const Z_TOKENS = [
  { name: '--z-sidebar', use: 'Sidebar' },
  { name: '--z-overlay', use: 'Dialogs, sheets, drawers' },
  { name: '--z-nested-overlay', use: 'A dialog opened from inside another overlay' },
  { name: '--z-above-onboard', use: "Must beat onboard's wallet modal (1450)" },
  { name: '--z-picker', use: 'Date / token pickers' },
]

/** Reads a custom property's computed value from an element inside `.shadcn-scope`. */
export const readToken = (element: Element | null, name: string): string =>
  element ? getComputedStyle(element).getPropertyValue(name).trim() : ''
