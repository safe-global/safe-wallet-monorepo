import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, BellRing, CircleCheckBig, LockKeyholeOpen } from 'lucide-react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { List, ListItem } from '@/components/ui/list'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { TRIAL_DISCLAIMER } from '@/features/safe-pro-announcement'
import { useSpaceOffers } from '../../hooks/billing/useSpaceOffers'
import { useStartCheckout } from '../../hooks/billing/useStartCheckout'
import { PlanCard } from './PlanCards'
import { trialTiers } from './planTiers'
import type { PlanSeatOption, PlanTier } from './types'

const PERKS = [
  [LockKeyholeOpen, 'All Pro features unlocked, no billing details needed upfront.'],
  [BellRing, 'You’ll get a reminder to provide billing details.'],
  [CircleCheckBig, 'Your subscription starts. Cancel any time.'],
] as const

export const RECOMMENDED_PLAN = 'Business'

export default function StartTrialModal({
  open,
  onOpenChange,
  spaceId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId?: string | null
}) {
  const { trialPlans, trialPeriodDays, isLoading } = useSpaceOffers(spaceId)
  const { startCheckout, isRedirecting, isError } = useStartCheckout(spaceId)
  const tiers = useMemo(() => trialTiers(trialPlans), [trialPlans])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm-md" surface="card" padding="sm">
        <div className="flex flex-col gap-6 pt-5">
          <StartTrialSteps
            tiers={tiers}
            trialPeriodDays={trialPeriodDays}
            isLoading={isLoading}
            isStarting={isRedirecting}
            isError={isError}
            onStart={(paymentLinkId) => void startCheckout(paymentLinkId)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Lives inside DialogContent so closing the dialog resets the selection.
const StartTrialSteps = ({
  tiers,
  trialPeriodDays,
  isLoading,
  isStarting,
  isError,
  onStart,
}: {
  tiers: PlanTier[]
  trialPeriodDays: number | null
  isLoading: boolean
  isStarting: boolean
  isError: boolean
  onStart: (paymentLinkId: string) => void
}) => {
  const [pickedTierId, setPickedTierId] = useState<string>()
  const [options, setOptions] = useState<Record<string, PlanSeatOption>>({})
  const tierId = pickedTierId ?? (tiers.find((tier) => tier.name === RECOMMENDED_PLAN) ?? tiers[0])?.id
  const tier = tiers.find((candidate) => candidate.id === tierId)
  const option = tier ? (options[tier.id] ?? tier.options[0]) : undefined

  return (
    <>
      <Typography variant="h3" as={DialogTitle}>
        {trialPeriodDays === null
          ? 'Start your free trial of Safe Pro'
          : `Start your ${trialPeriodDays}-day free trial of Safe Pro`}
      </Typography>

      <Card variant="brand" size="sm" radius="lg">
        <CardContent>
          <List orientation="horizontal" className="justify-between">
            {PERKS.map(([Icon, text]) => (
              <ListItem key={text} size="sm" className="w-[200px]">
                <Icon className="size-4 shrink-0 text-badge-dot-success" strokeWidth={1.5} />
                <Typography variant="paragraph-mini-medium">{text}</Typography>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Typography variant="paragraph-medium">Choose plan</Typography>
          <Button
            variant="ghost-muted"
            size="sm"
            render={<a href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" />}
          >
            Compare all features
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex gap-6" data-testid="trial-plans-skeleton">
            <Skeleton className="h-[220px] flex-1 rounded-lg-xl" />
            <Skeleton className="h-[220px] flex-1 rounded-lg-xl" />
          </div>
        ) : tiers.length === 0 ? (
          <Alert variant="info">
            <AlertSeverityIcon variant="info" />
            <AlertDescription>There is no free trial available for this Workspace.</AlertDescription>
          </Alert>
        ) : (
          <div role="radiogroup" aria-label="Plan" className="flex gap-6">
            {tiers.map((candidate) => (
              <PlanCard
                key={candidate.id}
                tier={candidate}
                selected={candidate.id === tierId}
                onSelect={() => setPickedTierId(candidate.id)}
                onOptionChange={(next) => setOptions((prev) => ({ ...prev, [candidate.id]: next }))}
              />
            ))}
          </div>
        )}
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>We couldn&apos;t start the checkout. Please try again.</AlertDescription>
        </Alert>
      )}

      <Typography variant="paragraph-small" color="muted" align="center">
        {TRIAL_DISCLAIMER}
      </Typography>

      <Button
        size="action"
        accentIcon
        className="self-center"
        disabled={!option?.paymentLinkId || isStarting}
        onClick={() => option?.paymentLinkId && onStart(option.paymentLinkId)}
      >
        Start free trial
        <ArrowRight />
      </Button>
    </>
  )
}
