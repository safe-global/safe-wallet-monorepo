// Design-token classes per severity tone, using the app convention (bg-[var(--color-*)] +
// text-[var(--color-*)]). The app leaves shadcn's --primary/--muted/--border vars undefined, so
// shadcn variant colours render transparent here — everything below uses real --color-* tokens.
// The banner uses the SAME dark in-family colour for icon + title + link (design `.ico{color:var(--fg)}`),
// NOT the bright `-main` accent, which is too light on the pale wash.
export const TONE = {
  warn: {
    bg: 'bg-[var(--color-warning-background)]',
    fg: 'text-[var(--color-warning-dark)]',
    chip: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
    wash: 'bg-[var(--color-warning-light)]',
  },
  critical: {
    bg: 'bg-[var(--color-error-background)]',
    fg: 'text-[var(--color-error-dark)]',
    chip: 'bg-[var(--color-error-light)] text-[var(--color-error-dark)]',
    wash: 'bg-[var(--color-error-light)]',
  },
} as const

export type Tone = (typeof TONE)[keyof typeof TONE]

// Green resolved chip (shown only after the trusted swap) background + text.
export const RESOLVED_TONE = {
  trusted: 'bg-[var(--color-success-background)] text-[var(--color-success-dark)]',
} as const

// Filled circular icon badge in the resolved chip (`.ricon` — solid colour, white glyph).
export const RESOLVED_ICON_BG = {
  trusted: 'bg-[var(--color-success-main)]',
} as const
