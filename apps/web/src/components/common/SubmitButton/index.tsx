import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/utils/cn'

// Closed preset: `size` and `className` are intentionally NOT accepted so the
// submit-button identity (height, padding, radius) can't be overridden at the
// call site. Layout is a semantic prop (`fullWidth`); everything else — variant,
// onClick, type, form, disabled, data-testid — passes through.
type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'size' | 'className'> & {
  /** Show a spinner in place of the label and disable the button while pending. */
  loading?: boolean
  /** Stretch to the container width (e.g. the stacked-mobile flow-submit pattern). */
  fullWidth?: boolean
  children: ReactNode
}

/**
 * SubmitButton — the canonical modal / flow / settings submit button.
 *
 * Owns `size="submit"` (a stable min-width so the label can swap to a spinner
 * without the button resizing) and the loading → spinner swap. Reach for this
 * instead of `<Button size="submit">` + a hand-rolled spinner so every submit
 * button is the same size and behaves the same while pending.
 *
 * Defaults to `type="submit"` and `variant="default"` (the primary action).
 * It does not take a styling `className` — use `fullWidth` for layout; if you
 * genuinely need something else, use the primitive `<Button>` (guarded by lint).
 */
const SubmitButton = ({
  loading = false,
  disabled,
  type = 'submit',
  fullWidth = false,
  children,
  ...props
}: SubmitButtonProps) => (
  <Button type={type} size="submit" disabled={disabled || loading} {...props} className={cn(fullWidth && 'w-full')}>
    {loading ? <Spinner /> : children}
  </Button>
)

export default SubmitButton
