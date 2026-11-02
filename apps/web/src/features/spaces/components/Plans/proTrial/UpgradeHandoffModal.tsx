import { useState } from 'react'
import { ArrowUpRight, Lock } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { PlanPick } from '@safe-global/views/features/spaces/components/Plans/types'
import { useStartCheckout } from '../../../hooks/billing/useStartCheckout'
import { formatPlanPrice } from '../planTiers'
import { PRO_TRIAL_COPY } from './copy'

/** The one step between a named upgrade and Stripe: the plan is preselected and nothing is charged before Stripe. */
const UpgradeHandoffModal = ({
  spaceId,
  pick,
  onClose,
}: {
  spaceId: string
  /** The plan the upgrade button named; undefined keeps the modal closed. */
  pick: PlanPick | undefined
  onClose: () => void
}) => {
  const { startCheckout, isRedirecting, isError } = useStartCheckout(spaceId)
  const [hasLeft, setHasLeft] = useState(false)
  const planName = pick ? PRO_TRIAL_COPY.planName(pick.tier.name, pick.option.seats) : ''
  const price = pick?.option.price != null ? formatPlanPrice(pick.option.price, pick.tier.currency) : null
  const isOpening = isRedirecting || (hasLeft && !isError)

  const close = () => {
    setHasLeft(false)
    onClose()
  }

  return (
    <Dialog open={pick !== undefined} onOpenChange={(open) => !open && !isOpening && close()}>
      <DialogContent
        size="xs"
        surface="card"
        padding="sm"
        showCloseButton={false}
        // eslint-disable-next-line no-restricted-syntax -- prototype: the Safe Pro mint stroke; a real PR adds a DialogContent variant
        className="border-2 border-mint"
        data-testid="upgrade-handoff"
      >
        <div className="flex flex-col gap-6 pt-5">
          <div className="flex flex-col gap-1">
            <Typography variant="h3" as={DialogTitle}>
              {PRO_TRIAL_COPY.upgradeTo(planName)}
            </Typography>
            {price && <DialogDescription>{PRO_TRIAL_COPY.handoff.price(price)}</DialogDescription>}
          </div>

          <Typography variant="paragraph-small" color="muted" className="flex items-start gap-2">
            <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
            {PRO_TRIAL_COPY.handoff.noCharge}
          </Typography>

          {isError && (
            <Alert variant="destructive">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{PRO_TRIAL_COPY.handoff.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              weight="semibold"
              className="w-full"
              disabled={isOpening || !pick?.option.paymentLinkId}
              onClick={() => {
                if (!pick?.option.paymentLinkId) return
                setHasLeft(true)
                void startCheckout(pick.option.paymentLinkId)
              }}
              data-testid="upgrade-handoff-continue"
            >
              {isOpening ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {PRO_TRIAL_COPY.handoff.opening}
                </>
              ) : (
                <>
                  {PRO_TRIAL_COPY.handoff.continue}
                  <ArrowUpRight data-icon="inline-end" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              weight="semibold"
              className="w-full"
              onClick={close}
              disabled={isOpening}
            >
              {PRO_TRIAL_COPY.handoff.back}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradeHandoffModal
