import { useState, type ReactNode } from 'react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
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
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount } from '../copy'
import { IDLE_CASH } from '../opportunities'
import { dedicatedSafeName } from '../shelf'
import type { Operation, Opportunity } from '../types'

const COPY = DEFI_V1_COPY.operations
const LAST_STEP = COPY.flowSteps.length - 1

type Where = 'dedicated' | 'this'
type Frequency = 'once' | 'monthly'

const Choice = ({
  value,
  title,
  detail,
  badge,
  children,
}: {
  value: string
  title: string
  detail?: string
  badge?: ReactNode
  children?: ReactNode
}) => (
  <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-card px-3 py-2.5">
    <RadioGroupItem value={value} className="mt-0.5" />
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex items-center gap-2 text-sm font-medium">
        {title}
        {badge}
      </span>
      {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      {children}
    </span>
  </label>
)

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value}</span>
  </div>
)

const Stepper = ({ step }: { step: number }) => (
  <ol className="flex gap-3 px-4 pt-3 text-xs">
    {COPY.flowSteps.map((label, index) => (
      <li
        key={label}
        className={cn('flex items-center gap-1.5', index === step ? 'text-foreground' : 'text-muted-foreground')}
      >
        <span
          className={cn(
            'flex size-4 items-center justify-center rounded-full text-[10px]',
            index <= step ? 'bg-foreground text-background' : 'bg-muted',
          )}
        >
          {index + 1}
        </span>
        {label}
      </li>
    ))}
  </ol>
)

/** Simon's "Set investment" flow: opportunity and amount, who invests, where it runs, review. */
export const SetUpInvestmentDialog = ({
  open,
  opportunity,
  options,
  onClose,
  onCreate,
}: {
  open: boolean
  opportunity: Opportunity | null
  options: Opportunity[]
  onClose: () => void
  onCreate: (operation: Operation) => void
}) => {
  const { safe } = useSafeInfo()
  const owners = safe.owners.map((owner) => owner.value)
  const [step, setStep] = useState(0)
  const [pickedId, setPickedId] = useState(opportunity?.id ?? options[0]?.id ?? '')
  const [budget, setBudget] = useState(String(IDLE_CASH.amount))
  const [frequency, setFrequency] = useState<Frequency>('once')
  const [signers, setSigners] = useState<string[]>(owners)
  const [threshold, setThreshold] = useState(1)
  const [where, setWhere] = useState<Where>('dedicated')
  const picked = opportunity ?? options.find((item) => item.id === pickedId) ?? options[0]
  const [name, setName] = useState('')
  const safeName = name.trim() || (picked ? dedicatedSafeName(picked) : '')
  const amount = Number(budget.replace(/[^0-9.]/g, '')) || 0
  const canContinue = [Boolean(picked) && amount > 0, signers.length > 0, true, true][step]

  if (!picked) return null

  const toggleSigner = (address: string) => {
    const next = signers.includes(address) ? signers.filter((item) => item !== address) : [...signers, address]
    setSigners(next)
    setThreshold((current) => Math.min(current, Math.max(next.length, 1)))
  }

  const close = () => {
    setStep(0)
    setName('')
    onClose()
  }

  const submit = () => {
    if (where === 'dedicated') {
      onCreate({
        id: `dedicated-${picked.id}-${Date.now()}`,
        name: safeName,
        budget: amount,
        invested: 0,
        threshold,
        owners: signers.length,
        opportunityIds: [picked.id],
      })
    }
    close()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="sm" data-testid="set-up-investment">
        <DialogHeader divided="subtle">
          <DialogTitle>{COPY.newSafe}</DialogTitle>
          <DialogDescription>{picked.name}</DialogDescription>
        </DialogHeader>
        <Stepper step={step} />
        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-3">
          {step === 0 && (
            <>
              {!opportunity && (
                <div className="flex flex-col gap-1.5">
                  <Label>{COPY.investment}</Label>
                  <RadioGroup value={picked.id} onValueChange={(next) => setPickedId(String(next))} className="gap-1.5">
                    {options.map((option) => (
                      <Choice key={option.id} value={option.id} title={option.name} detail={option.exitShort} />
                    ))}
                  </RadioGroup>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="investment-amount">{COPY.amount}</Label>
                <Input
                  id="investment-amount"
                  inputMode="decimal"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{COPY.frequency}</Label>
                <RadioGroup
                  value={frequency}
                  onValueChange={(next) => setFrequency(next as Frequency)}
                  className="grid-cols-2 gap-1.5"
                >
                  <Choice value="once" title={COPY.oneTime} />
                  <Choice value="monthly" title={COPY.monthly} badge={<Badge variant="warning">{COPY.later}</Badge>} />
                </RadioGroup>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>{COPY.signersLabel}</Label>
                <div className="flex flex-col gap-1 rounded-lg bg-card p-2">
                  {owners.map((address) => (
                    <label key={address} className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm">
                      <Checkbox checked={signers.includes(address)} onCheckedChange={() => toggleSigner(address)} />
                      <span className="font-mono text-xs">{shortenAddress(address)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{COPY.approvals}</Label>
                <RadioGroup
                  value={String(threshold)}
                  onValueChange={(next) => setThreshold(Number(next))}
                  className="grid-cols-3 gap-1.5"
                >
                  {Array.from({ length: Math.max(signers.length, 1) }, (_, index) => index + 1).map((count) => (
                    <Choice key={count} value={String(count)} title={COPY.signers(count, signers.length)} />
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {step === 2 && (
            <RadioGroup value={where} onValueChange={(next) => setWhere(next as Where)} className="gap-1.5">
              <Choice
                value="dedicated"
                title={COPY.dedicated}
                badge={<Badge variant="success">{COPY.recommended}</Badge>}
                detail={COPY.dedicatedHint(safeName)}
              >
                {where === 'dedicated' && (
                  <Input
                    aria-label={COPY.name}
                    value={name}
                    maxLength={40}
                    placeholder={dedicatedSafeName(picked)}
                    onChange={(event) => setName(event.target.value)}
                  />
                )}
              </Choice>
              <Choice
                value="this"
                title={COPY.thisSafe}
                badge={<Badge variant="warning">{COPY.later}</Badge>}
                detail={COPY.thisSafeCaveat}
              />
            </RadioGroup>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-col rounded-lg bg-card px-3 py-1.5">
                <ReviewRow label={COPY.investment} value={picked.name} />
                <ReviewRow
                  label={COPY.amount}
                  value={`${formatAmount(amount)} ${picked.asset} · ${frequency === 'once' ? COPY.oneTime : COPY.monthly}`}
                />
                <ReviewRow label={COPY.approvals} value={COPY.signers(threshold, signers.length)} />
                <ReviewRow label={COPY.whereItRuns} value={where === 'dedicated' ? safeName : COPY.thisSafe} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{COPY.steps}</Label>
                <ol className="flex list-decimal flex-col gap-1 rounded-lg bg-card py-2 pr-3 pl-8 text-sm">
                  {where === 'dedicated' && <li>{COPY.stepCreate(safeName, threshold, signers.length)}</li>}
                  {where === 'dedicated' && <li>{COPY.stepMove(formatAmount(amount), picked.asset)}</li>}
                  <li>{COPY.stepDeposit(formatAmount(amount), picked.asset, picked.name)}</li>
                </ol>
              </div>
              <Typography variant="paragraph-mini" color="muted">
                {COPY.guardNote}
              </Typography>
            </>
          )}
        </div>
        <DialogFooter divided="subtle">
          <Typography variant="paragraph-small" color="muted" align="center">
            {COPY.approveOnce(safe.threshold, owners.length)}
          </Typography>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(step - 1)}>
                {COPY.back}
              </Button>
            )}
            <Button
              size="lg"
              className="flex-1"
              disabled={!canContinue}
              onClick={() => (step === LAST_STEP ? submit() : setStep(step + 1))}
            >
              {step === LAST_STEP ? COPY.submit : COPY.next}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
