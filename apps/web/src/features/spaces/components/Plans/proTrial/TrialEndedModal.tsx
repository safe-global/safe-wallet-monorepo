import { useState } from 'react'
import { ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Link } from '@safe-global/views/components/ui/link'
import { Typography } from '@safe-global/views/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { CONTACT_SALES_URL } from '../../../constants'
import { formatPlanPrice } from '../planTiers'
import PlanChooserModal from '../PlanChooserModal'
import { PRO_TRIAL_COPY } from './copy'
import { isSalesLed } from './recommendPlan'
import UpgradeHandoffModal from './UpgradeHandoffModal'
import { useRecommendedPick } from './useRecommendedPick'

/** After the trial: the Safes are one click away, the right-sized plan is named, and nothing reads as a lock. */
export default function TrialEndedModal({
  spaceId,
  endedAt,
  onContinue,
}: {
  spaceId: string
  endedAt: number | null
  /** Opens the user's accounts list, outside the Workspace. */
  onContinue: () => void
}) {
  const { pick, safeCount } = useRecommendedPick(spaceId)
  const [step, setStep] = useState<'ended' | 'handoff' | 'plans'>('ended')

  if (step === 'plans') {
    return <PlanChooserModal spaceId={spaceId} reason="lapsed" endedAt={endedAt} onBack={() => setStep('ended')} />
  }

  const planName = pick ? PRO_TRIAL_COPY.planName(pick.tier.name, pick.option.seats) : undefined
  const isSalesPick = pick ? isSalesLed(pick.option.seats ?? null) : false
  const price = pick?.option.price != null ? formatPlanPrice(pick.option.price, pick.tier.currency) : null

  return (
    <>
      <Dialog open={step === 'ended'} onOpenChange={() => undefined}>
        <DialogContent
          size="xs"
          surface="card"
          padding="sm"
          showCloseButton={false}
          // eslint-disable-next-line no-restricted-syntax -- prototype: the Safe Pro mint stroke; a real PR adds a DialogContent variant
          className="border-2 border-mint"
          data-testid="trial-ended"
        >
          <div className="flex flex-col gap-6 pt-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-success-subtle">
              <ShieldCheck aria-hidden className="size-5 text-success-strong" />
            </span>
            <div className="flex flex-col gap-2">
              <Typography variant="h3" as={DialogTitle}>
                {PRO_TRIAL_COPY.trialEnded.title}
              </Typography>
              <DialogDescription>
                {PRO_TRIAL_COPY.trialEnded.body(endedAt === null ? null : formatDate(endedAt))}
              </DialogDescription>
            </div>

            {planName && safeCount !== undefined && (
              <div className="flex flex-col gap-0.5">
                <Typography variant="paragraph-small-medium">
                  {PRO_TRIAL_COPY.trialEnded.fit(planName, safeCount)}
                </Typography>
                {price && (
                  <Typography variant="paragraph-small" color="muted">
                    {isSalesPick
                      ? `${PRO_TRIAL_COPY.fromPrice(price)} /mo per Workspace`
                      : `${price} /mo per Workspace`}
                  </Typography>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {planName &&
                (isSalesPick ? (
                  <Button
                    size="lg"
                    weight="semibold"
                    className="w-full"
                    render={<a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />}
                  >
                    {PRO_TRIAL_COPY.talkToUs}
                    <ArrowUpRight data-icon="inline-end" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    weight="semibold"
                    accentIcon
                    className="w-full"
                    onClick={() => setStep('handoff')}
                    data-testid="trial-ended-upgrade"
                  >
                    {PRO_TRIAL_COPY.upgradeTo(planName)}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                ))}
              <Button
                variant="outline"
                size="lg"
                weight="semibold"
                className="w-full"
                onClick={onContinue}
                data-testid="trial-ended-continue"
              >
                {PRO_TRIAL_COPY.trialEnded.continue}
              </Button>
            </div>

            <Link
              render={<button type="button" />}
              variant="muted"
              className="self-center"
              onClick={() => setStep('plans')}
            >
              {PRO_TRIAL_COPY.trialEnded.seePlans}
            </Link>
          </div>
        </DialogContent>
      </Dialog>
      <UpgradeHandoffModal
        spaceId={spaceId}
        pick={step === 'handoff' ? pick : undefined}
        onClose={() => setStep('ended')}
      />
    </>
  )
}
