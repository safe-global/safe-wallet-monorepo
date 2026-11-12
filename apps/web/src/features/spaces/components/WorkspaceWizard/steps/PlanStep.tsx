import { useState, type ReactElement } from 'react'
import OnboardingFooter from '@safe-global/views/components/common/OnboardingFooter'
import { Alert, AlertAction, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Link } from '@safe-global/views/components/ui/link'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Typography } from '@safe-global/views/components/ui/typography'
import { TrialPlanCard } from '@safe-global/views/features/spaces/components/Plans/TrialPlanParts'
import type { TrialSize } from '@safe-global/views/features/spaces/components/Plans/types'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import { useStepAdvance } from '../hooks/useStepAdvance'
import { useTrialSizes } from '../hooks/useTrialSizes'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'
import WizardFrame from '../WizardFrame'

const PlanPicker = ({
  sizes,
  size,
  isError,
  trialPeriodDays,
  onPick,
  onRetry,
}: {
  sizes: TrialSize[] | undefined
  size: TrialSize | undefined
  isError: boolean
  trialPeriodDays: number | null
  onPick: (size: TrialSize) => void
  onRetry: () => void
}): ReactElement => {
  if (isError && !sizes) {
    return (
      <Alert variant="destructive" data-testid="trial-plans-error">
        <AlertSeverityIcon variant="destructive" />
        <AlertDescription>We couldn&apos;t load the plans. Please try again.</AlertDescription>
        <AlertAction>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </AlertAction>
      </Alert>
    )
  }
  if (!sizes) return <Skeleton className="h-96 w-full max-w-md rounded-lg-xl" data-testid="trial-plans-skeleton" />
  if (!size) {
    return (
      <Alert variant="info">
        <AlertSeverityIcon variant="info" />
        <AlertDescription>There is no free trial available right now.</AlertDescription>
      </Alert>
    )
  }
  return <TrialPlanCard sizes={sizes} value={size} onChange={onPick} trialPeriodDays={trialPeriodDays} />
}

const PlanStep = (): ReactElement => {
  const { draft, isReady } = useWorkspaceDraft()
  const { stepNumber, totalSteps, advance, retreat } = useStepAdvance('plan')
  const { sizes, trialPeriodDays, isError, refetch } = useTrialSizes()
  const [pickedLinkId, setPickedLinkId] = useState<string>()

  const wantedLinkId = pickedLinkId ?? draft.paymentLinkId
  const size = sizes?.find((candidate) => candidate.paymentLinkId === wantedLinkId) ?? sizes?.[0]
  const freeDays = trialPeriodDays === null ? 'Free to start' : `Free for ${trialPeriodDays} days`

  const onNext = () => {
    if (size) advance({ paymentLinkId: size.paymentLinkId })
  }
  // Back keeps only a plan the user picked, not the one shown by default.
  const onBack = () => retreat(pickedLinkId ? { paymentLinkId: pickedLinkId } : {})

  return (
    <WizardFrame
      draft={draft}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title="Pick your plan"
      subtitle={`${freeDays}. Pick how many Safe accounts you need.`}
      highlight="accounts"
      footer={
        <OnboardingFooter
          onBack={onBack}
          continueLabel="Next"
          onContinue={onNext}
          continueDisabled={!isReady || !size}
          continueTestId="plan-step-continue-button"
        />
      }
    >
      <PlanPicker
        sizes={sizes}
        size={size}
        isError={isError}
        trialPeriodDays={trialPeriodDays}
        onPick={(picked) => setPickedLinkId(picked.paymentLinkId)}
        onRetry={() => void refetch()}
      />

      <Typography variant="paragraph-small" color="muted">
        No card needed, and you won&apos;t be charged after the trial. More than 20 Safes?{' '}
        <Link href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer">
          Talk to sales
        </Link>
      </Typography>
    </WizardFrame>
  )
}

export default PlanStep
