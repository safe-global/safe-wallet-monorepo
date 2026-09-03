import { useState } from 'react'
import { ArrowRight, ArrowUpRight, BellRing, CircleCheckBig, LockKeyholeOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { List, ListItem } from '@/components/ui/list'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { PlanCard } from './PlanCards'
import { TRIAL_TOOLTIP } from './PlanStatusCard'
import { RECOMMENDED_TRIAL_TIER, TRIAL_TIERS } from './fixtures'
import SelectAccountsStep from './SelectAccountsStep'

const PERKS = [
  [LockKeyholeOpen, 'All Pro features unlocked, no billing details needed upfront.'],
  [BellRing, 'You’ll get a reminder to provide billing details.'],
  [CircleCheckBig, 'Your subscription starts. Cancel any time.'],
] as const

export type TrialSelection = { tierId: string; seats: string; safeIds: string[] }

export default function StartTrialModal({
  trialDays,
  open,
  onOpenChange,
  onContinue,
}: {
  trialDays: 30 | 60
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: (selection: TrialSelection) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm-md" surface="card" padding="sm">
        <div className="flex flex-col gap-6 pt-5">
          <StartTrialSteps trialDays={trialDays} onContinue={onContinue} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Lives inside DialogContent so closing the dialog resets the flow.
const StartTrialSteps = ({
  trialDays,
  onContinue,
}: {
  trialDays: 30 | 60
  onContinue: (selection: TrialSelection) => void
}) => {
  const [step, setStep] = useState<'plan' | 'accounts'>('plan')
  const [tierId, setTierId] = useState(RECOMMENDED_TRIAL_TIER)
  const [seats, setSeats] = useState<Record<string, string>>({})
  const tierSeats = seats[tierId] ?? TRIAL_TIERS.find((tier) => tier.id === tierId)?.seats[0] ?? ''

  if (step === 'accounts') {
    return (
      <SelectAccountsStep
        limit={Number.parseInt(tierSeats, 10)}
        onBack={() => setStep('plan')}
        onContinue={(safeIds) => onContinue({ tierId, seats: tierSeats, safeIds })}
      />
    )
  }

  return (
    <>
      <Typography variant="h3" as={DialogTitle}>
        Start your {trialDays}-day free trial of Safe Pro
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

        <div role="radiogroup" aria-label="Plan" className="flex gap-6">
          {TRIAL_TIERS.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              selected={tier.id === tierId}
              onSelect={() => setTierId(tier.id)}
              onSeatsChange={(value) => setSeats((prev) => ({ ...prev, [tier.id]: value }))}
            />
          ))}
        </div>
      </div>

      <Typography variant="paragraph-small" color="muted" align="center">
        {TRIAL_TOOLTIP}
      </Typography>

      <Button size="action" accentIcon className="self-center" onClick={() => setStep('accounts')}>
        Start free trial
        <ArrowRight />
      </Button>
    </>
  )
}
