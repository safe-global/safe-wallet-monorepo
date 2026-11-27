import { useState, type ReactNode } from 'react'
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@safe-global/views/components/ui/input-group'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DrawerActions } from '@safe-global/views/components/common/Drawer/components/DrawerActions'
import { DrawerFooter } from '@safe-global/views/components/common/Drawer/components/DrawerFooter'
import { DrawerSection } from '@safe-global/views/components/common/Drawer/components/DrawerSection'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount, formatCompactUsd } from '../copy'
import type { Holding, Opportunity } from '../types'

const COPY = DEFI_V1_COPY.action

export type ActionResult = { opportunity: Opportunity; amount: number; pending: boolean }

const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium tabular-nums">{value}</span>
  </div>
)

/** Deposit opens the start earning modal; withdraw happens here, back to this Safe. */
export const ActionPanel = ({
  opportunity,
  holding,
  locked,
  onDeposit,
  onWithdrawn,
}: {
  opportunity: Opportunity
  holding?: Holding
  locked: boolean
  onDeposit: () => void
  onWithdrawn: (result: ActionResult) => void
}) => {
  const { safe } = useSafeInfo()
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [value, setValue] = useState(String(holding?.invested ?? 0))
  const [done, setDone] = useState<{ pending: boolean } | null>(null)
  const amount = Number(value.replace(/[^0-9.]/g, '')) || 0
  const owners = safe.owners.length
  const needsMore = safe.threshold > 1
  const available = holding?.invested ?? 0
  const tooMuch = amount > available
  const steps = COPY.withdrawSteps(formatAmount(amount), opportunity.asset, opportunity.name)

  const submit = () => {
    setDone({ pending: needsMore })
    onWithdrawn({ opportunity, amount, pending: needsMore })
  }

  if (locked) {
    return (
      <DrawerFooter>
        <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5 pb-2">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          {DEFI_V1_COPY.drawer.lockedNote}
        </Typography>
        <DrawerActions
          primary={
            <Button size="lg" data-testid="see-pro">
              <Lock />
              {DEFI_V1_COPY.seePro}
            </Button>
          }
        />
      </DrawerFooter>
    )
  }

  if (done) {
    const left = Math.max(safe.threshold - 1, 1)
    return (
      <DrawerFooter>
        <div className="flex items-start gap-3 pb-2">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-badge-dot-success" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <Typography variant="paragraph-small-medium">
              {done.pending ? DEFI_V1_COPY.deposit.proposalCreated : COPY.doneTitle.withdraw}
            </Typography>
            <Typography variant="paragraph-small" color="muted">
              {done.pending ? DEFI_V1_COPY.deposit.proposalNext(left) : DEFI_V1_COPY.deposit.depositedNext}
            </Typography>
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            setDone(null)
            setIsWithdrawing(false)
          }}
        >
          {DEFI_V1_COPY.deposit.done}
        </Button>
      </DrawerFooter>
    )
  }

  if (!isWithdrawing) {
    return (
      <DrawerFooter>
        <DrawerActions
          secondary={
            holding && (
              <Button variant="outline" size="lg" disabled={!holding.invested} onClick={() => setIsWithdrawing(true)}>
                {COPY.withdraw}
              </Button>
            )
          }
          primary={
            <Button size="lg" onClick={onDeposit} data-testid="drawer-deposit">
              {COPY.deposit}
            </Button>
          }
        />
      </DrawerFooter>
    )
  }

  return (
    <DrawerFooter>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="defi-amount">{DEFI_V1_COPY.deposit.amount}</Label>
          <InputGroup>
            <InputGroupInput
              id="defi-amount"
              inputMode="decimal"
              value={value}
              aria-invalid={tooMuch || undefined}
              onChange={(event) => setValue(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>{opportunity.asset}</InputGroupText>
              <InputGroupButton variant="ghost" size="xs" onClick={() => setValue(String(available))}>
                {COPY.max}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <Typography variant="paragraph-mini" color="muted" className={tooMuch ? 'text-destructive' : undefined}>
            {tooMuch
              ? COPY.tooMuch(formatAmount(available))
              : COPY.withdrawFrom(formatCompactUsd(available), opportunity.exitLabel)}
          </Typography>
        </div>

        <DrawerSection
          title={DEFI_V1_COPY.deposit.approve}
          rightNode={COPY.stepCount(steps.length)}
          collapsible
          defaultOpen={false}
        >
          <ol className="flex list-decimal flex-col gap-1.5 rounded-lg bg-card py-3 pr-3 pl-8">
            {steps.map((step) => (
              <li key={step}>
                <Typography variant="paragraph-small">{step}</Typography>
              </li>
            ))}
          </ol>
          <Typography variant="paragraph-mini" color="muted">
            {COPY.settles.deposit} {COPY.simulated}
          </Typography>
          <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
            {DEFI_V1_COPY.deposit.returnRule}
          </Typography>
        </DrawerSection>

        <div className="grid grid-cols-2 gap-3">
          <Fact label={DEFI_V1_COPY.drawer.exit} value={opportunity.exitShort} />
          <Fact label={DEFI_V1_COPY.drawer.approval} value={DEFI_V1_COPY.drawer.signers(safe.threshold, owners)} />
        </div>

        <DrawerActions
          secondary={
            <Button variant="outline" size="lg" onClick={() => setIsWithdrawing(false)}>
              {DEFI_V1_COPY.operations.back}
            </Button>
          }
          primary={
            <Button size="lg" disabled={amount <= 0 || tooMuch} onClick={submit}>
              {!needsMore ? COPY.submitNow.withdraw : DEFI_V1_COPY.deposit.createProposal}
            </Button>
          }
        />
      </div>
    </DrawerFooter>
  )
}
