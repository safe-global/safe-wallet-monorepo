/**
 * Matches AddressInput `.inputWrapper` sizing: 66px height, 12px/16px padding.
 *
 * Size and skin only — no `focus-visible:*`. This is merged over a primitive's own classes with
 * `cn` (tailwind-merge), so a focus rule here silently replaces the primitive's: it used to
 * downgrade SelectTrigger's `ring-ring/50` 3px halo to a 1px `ring-ring` and hold the border at its
 * resting colour, which is invisible in dark mode (`--ring` and `--border` are both `#404040`).
 */
export const largeFormFieldSurfaceClassName =
  'min-h-[66px] h-[66px] rounded-[calc(var(--radius)-2px)] border-border bg-card px-4 shadow-none'

export const largeFormFieldRowClassName = 'flex h-[66px] min-w-0 items-center'
