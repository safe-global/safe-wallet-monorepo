import { useState } from 'react'
import { CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Input } from '@safe-global/views/components/ui/input'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatAmount, formatUsd } from '../copy'
import useSafeInfo from '@/hooks/useSafeInfo'
import { IDLE_CASH, POLICY_PREVIEW } from '../opportunities'
import { depositSteps } from '../shelf'
import type { DefiV1Signing, Opportunity } from '../types'

const COPY = DEFI_V1_COPY.deposit

export type DepositResult = { opportunity: Opportunity; amount: number; pending: boolean }

const Done = ({
  pending,
  signaturesLeft,
  onClose,
}: {
  pending: boolean
  signaturesLeft: number
  onClose: () => void
}) => (
  <>
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <CheckCircle2 className="size-10 text-badge-dot-success" aria-hidden />
      <Typography variant="h4">{pending ? COPY.proposalCreated : COPY.deposited}</Typography>
      <Typography color="muted">{pending ? COPY.proposalNext(signaturesLeft) : COPY.depositedNext}</Typography>
    </div>
    <DialogFooter>
      <Button size="lg" onClick={onClose}>
        {COPY.done}
      </Button>
    </DialogFooter>
  </>
)

export const DepositDialog = ({
  opportunity,
  signing,
  onClose,
  onDeposited,
}: {
  opportunity: Opportunity | null
  signing: DefiV1Signing
  onClose: () => void
  onDeposited: (result: DepositResult) => void
}) => {
  const { safe } = useSafeInfo()
  const [value, setValue] = useState(String(IDLE_CASH.amount))
  const [result, setResult] = useState<DepositResult | null>(null)
  const amount = Number(value.replace(/[^0-9.]/g, '')) || 0
  const usesPolicy =
    signing === 'policy' && opportunity !== null && POLICY_PREVIEW.opportunityIds.includes(opportunity.id)

  const close = () => {
    setResult(null)
    onClose()
  }

  const submit = () => {
    if (!opportunity) return
    const deposit = { opportunity, amount, pending: !usesPolicy }
    setResult(deposit)
    onDeposited(deposit)
  }

  return (
    <Dialog open={opportunity !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent size="sm" data-testid="deposit-dialog">
        {opportunity && result && (
          <Done pending={result.pending} signaturesLeft={Math.max(safe.threshold - 1, 1)} onClose={close} />
        )}

        {opportunity && !result && (
          <>
            <DialogHeader divided="subtle">
              <DialogTitle>{COPY.title(opportunity.name)}</DialogTitle>
              <DialogDescription>{DEFI_V1_COPY.factSheet.thirdParty(opportunity.runBy)}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5 px-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="defi-amount">{COPY.amount}</Label>
                <Input
                  id="defi-amount"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
                <Typography variant="paragraph-small" color="muted">
                  {COPY.from}: {COPY.fromValue(IDLE_CASH.asset, IDLE_CASH.chain, formatAmount(IDLE_CASH.amount))}
                </Typography>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
                <Typography variant="paragraph-small-bold">{COPY.approve}</Typography>
                <Typography variant="paragraph-small" color="muted">
                  {COPY.approveLead}
                </Typography>
                <ol className="mt-1 flex list-decimal flex-col gap-1.5 pl-5">
                  {depositSteps(opportunity, IDLE_CASH, formatAmount(amount)).map((step) => (
                    <li key={step}>
                      <Typography variant="paragraph-small">{step}</Typography>
                    </li>
                  ))}
                </ol>
                <Typography variant="paragraph-small-medium" className="mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden />
                  {COPY.returnRule}
                </Typography>
                <Typography variant="paragraph-small" color="muted">
                  {COPY.yearly(formatUsd(amount * opportunity.apy))}
                </Typography>
              </div>

              <div className="flex items-center gap-2">
                <Users className="size-4 shrink-0" aria-hidden />
                <Typography variant="paragraph-small-medium">
                  {usesPolicy ? COPY.policy(POLICY_PREVIEW.name) : COPY.threshold(safe.threshold, safe.owners.length)}
                </Typography>
                {usesPolicy && <Badge variant="warning">{COPY.comingSoon}</Badge>}
              </div>
            </div>

            <DialogFooter divided="subtle">
              <Button size="lg" disabled={amount <= 0} onClick={submit}>
                {usesPolicy ? COPY.depositNow : COPY.createProposal}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
