import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

// Closed preset: the onboarding footer owns its buttons' size/variant/skin and
// takes no styling className. Callers supply behaviour (labels, handlers,
// disabled/loading, testids) only.
type OnboardingFooterProps = {
  /** Omit to render a Continue-only footer (first step). */
  onBack?: () => void
  backLabel?: string
  backDisabled?: boolean
  continueLabel: ReactNode
  onContinue?: () => void
  /** `"submit"` submits the surrounding flow `<form>` (pair with `continueForm`). */
  continueType?: 'button' | 'submit'
  continueForm?: string
  continueDisabled?: boolean
  continueLoading?: boolean
  continueTestId?: string
}

/**
 * OnboardingFooter — the Back / Continue footer for the full-screen Spaces
 * onboarding flows. Owns the taller `size="xl"` (48px) CTA scale, the Back
 * (secondary) + Continue (primary) treatment, the left/right chevrons, the
 * loading → spinner swap, and the single-row layout: Back and Continue share one
 * row at every width, each taking half of it. Reach for this instead of
 * hand-building the footer so every onboarding step matches.
 */
const OnboardingFooter = ({
  onBack,
  backLabel = 'Back',
  backDisabled = false,
  continueLabel,
  onContinue,
  continueType = 'button',
  continueForm,
  continueDisabled = false,
  continueLoading = false,
  continueTestId,
}: OnboardingFooterProps) => (
  <div className="flex items-center gap-3">
    {onBack && (
      <Button type="button" variant="secondary" size="xl" onClick={onBack} disabled={backDisabled} className="flex-1">
        <ChevronLeft />
        {backLabel}
      </Button>
    )}
    <Button
      type={continueType}
      form={continueForm}
      size="xl"
      onClick={onContinue}
      disabled={continueDisabled || continueLoading}
      data-testid={continueTestId}
      className="flex-1"
    >
      {continueLoading ? (
        <Spinner />
      ) : (
        <>
          {continueLabel}
          <ChevronRight />
        </>
      )}
    </Button>
  </div>
)

export default OnboardingFooter
