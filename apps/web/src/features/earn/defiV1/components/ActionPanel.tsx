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
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Tabs, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DrawerSection } from '@/components/common/Drawer'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount, formatCompactUsd, formatUsd } from '../copy'
import { IDLE_CASH } from '../opportunities'
import { budgetLeft, depositSteps } from '../shelf'
import type { Holding, Operation, Opportunity } from '../types'

const COPY = DEFI_V1_COPY.action

type Mode = 'deposit' | 'withdraw'

export type ActionResult = { opportunity: Opportunity; amount: number; pending: boolean; operationId?: string }

const MAIN = 'main'

const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium tabular-nums">{value}</span>
  </div>
)

export const ActionPanel = ({
  opportunity,
  holding,
  locked,
  operations,
  onDeposited,
  onWithdrawn,
}: {
  opportunity: Opportunity
  holding?: Holding
  locked: boolean
  operations: Operation[]
  onDeposited: (result: ActionResult) => void
  onWithdrawn: (result: ActionResult) => void
}) => {
  const { safe } = useSafeInfo()
  const [mode, setMode] = useState<Mode>('deposit')
  const [value, setValue] = useState(String(IDLE_CASH.amount))
  const [done, setDone] = useState<{ mode: Mode; pending: boolean } | null>(null)
  const amount = Number(value.replace(/[^0-9.]/g, '')) || 0
  const [from, setFrom] = useState(MAIN)
  const operation = mode === 'deposit' ? operations.find((item) => item.id === from) : undefined
  const signers = operation
    ? { threshold: operation.threshold, owners: operation.owners }
    : { threshold: safe.threshold, owners: safe.owners.length }
  const needsMore = signers.threshold > 1
  const available =
    mode === 'deposit' ? (operation ? budgetLeft(operation) : IDLE_CASH.amount) : (holding?.invested ?? 0)
  const tooMuch = amount > available
  const steps =
    mode === 'deposit'
      ? depositSteps(opportunity, IDLE_CASH, formatAmount(amount))
      : COPY.withdrawSteps(formatAmount(amount), opportunity.asset, opportunity.name)

  const switchMode = (next: Mode) => {
    setMode(next)
    setValue(String(next === 'deposit' ? IDLE_CASH.amount : (holding?.invested ?? 0)))
  }

  const pickSource = (next: string) => {
    setFrom(next)
    const picked = operations.find((item) => item.id === next)
    setValue(String(picked ? budgetLeft(picked) : IDLE_CASH.amount))
  }

  const submit = () => {
    const result = { opportunity, amount, pending: needsMore, operationId: operation?.id }
    setDone({ mode, pending: result.pending })
    if (mode === 'deposit') onDeposited(result)
    else onWithdrawn(result)
  }

  if (done) {
    const left = Math.max(signers.threshold - 1, 1)
    return (
      <footer
        className="flex shrink-0 flex-col gap-4 border-t border-border bg-background p-6"
        data-testid="action-panel"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-badge-dot-success" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <Typography variant="paragraph-small-medium">
              {done.pending ? DEFI_V1_COPY.deposit.proposalCreated : COPY.doneTitle[done.mode]}
            </Typography>
            <Typography variant="paragraph-small" color="muted">
              {done.pending ? DEFI_V1_COPY.deposit.proposalNext(left) : DEFI_V1_COPY.deposit.depositedNext}
            </Typography>
          </div>
        </div>
        <Button variant="outline" size="lg" className="w-full" onClick={() => setDone(null)}>
          {DEFI_V1_COPY.deposit.done}
        </Button>
      </footer>
    )
  }

  return (
    <footer
      className="flex shrink-0 flex-col gap-4 border-t border-border bg-background p-6"
      data-testid="action-panel"
    >
      {holding && holding.invested > 0 && (
        <Tabs value={mode} onValueChange={(next) => switchMode(next as Mode)}>
          <TabsList aria-label={COPY.modeLabel} className="w-full">
            <TabsTrigger value="deposit" className="flex-1">
              {COPY.deposit}
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex-1">
              {COPY.withdraw}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {mode === 'deposit' && operations.length > 0 && !locked && (
        <div className="flex flex-col gap-1.5">
          <Label>{DEFI_V1_COPY.operations.payFrom}</Label>
          <RadioGroup value={from} onValueChange={(next) => pickSource(String(next))} className="gap-1.5">
            {[{ id: MAIN, name: DEFI_V1_COPY.operations.mainSafe }, ...operations].map((source) => {
              const picked = operations.find((item) => item.id === source.id)
              return (
                <label
                  key={source.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-card px-3 py-2 text-sm"
                >
                  <RadioGroupItem value={source.id} />
                  <span className="flex-1 font-medium">{source.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {picked
                      ? `${DEFI_V1_COPY.operations.signers(picked.threshold, picked.owners)} · ${DEFI_V1_COPY.operations.left(formatCompactUsd(budgetLeft(picked)))}`
                      : DEFI_V1_COPY.operations.signers(safe.threshold, safe.owners.length)}
                  </span>
                </label>
              )
            })}
          </RadioGroup>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defi-amount">{DEFI_V1_COPY.deposit.amount}</Label>
        <InputGroup>
          <InputGroupInput
            id="defi-amount"
            inputMode="decimal"
            value={value}
            disabled={locked}
            aria-invalid={tooMuch || undefined}
            onChange={(event) => setValue(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{opportunity.asset}</InputGroupText>
            <InputGroupButton variant="ghost" size="xs" disabled={locked} onClick={() => setValue(String(available))}>
              {COPY.max}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <Typography variant="paragraph-mini" color="muted" className={tooMuch ? 'text-destructive' : undefined}>
          {tooMuch
            ? COPY.tooMuch(formatAmount(available))
            : mode === 'deposit'
              ? operation
                ? `${operation.name} · ${DEFI_V1_COPY.operations.left(formatAmount(available))}`
                : DEFI_V1_COPY.deposit.fromValue(IDLE_CASH.asset, IDLE_CASH.chain, formatAmount(IDLE_CASH.amount))
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
        <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          {operation ? DEFI_V1_COPY.operations.returnTo(operation.name) : DEFI_V1_COPY.deposit.returnRule}
        </Typography>
      </DrawerSection>

      <div className="grid grid-cols-3 gap-3">
        {mode === 'deposit' && <Fact label={COPY.perYear} value={formatUsd(amount * opportunity.apy)} />}
        <Fact label={DEFI_V1_COPY.drawer.exit} value={opportunity.exitShort} />
        <Fact
          label={DEFI_V1_COPY.drawer.approval}
          value={DEFI_V1_COPY.drawer.signers(signers.threshold, signers.owners)}
        />
      </div>

      {locked && (
        <Typography variant="paragraph-mini" color="muted" className="flex items-center gap-1.5">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          {DEFI_V1_COPY.drawer.lockedNote}
        </Typography>
      )}

      <Button size="lg" className="w-full" disabled={locked || amount <= 0 || tooMuch} onClick={submit}>
        {locked && <Lock />}
        {locked ? DEFI_V1_COPY.locked : !needsMore ? COPY.submitNow[mode] : DEFI_V1_COPY.deposit.createProposal}
      </Button>
    </footer>
  )
}
