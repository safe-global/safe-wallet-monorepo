import { useState, type ReactNode } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
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
import InitialsAvatar from '@/components/common/InitialsAvatar'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount, formatApy } from '../copy'
import { IDLE_CASH } from '../opportunities'
import { dedicatedSafeName } from '../shelf'
import type { Frequency, Operation, Opportunity } from '../types'
import { OpportunityMark } from './TreasuryTables'

const COPY = DEFI_V1_COPY.operations
const LAST_STEP = COPY.flowSteps.length - 1
const FREQUENCIES = Object.keys(COPY.frequencies) as Frequency[]

type Where = 'dedicated' | 'this'
type Schedule = 'once' | 'recurring'

const parseAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0

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

const Field = ({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>
)

const ReviewPanel = ({ title, rows }: { title: string; rows: [string, string][] }) => (
  <div className="flex flex-col rounded-lg bg-card px-3 py-2">
    <span className="pb-1 text-xs font-medium text-muted-foreground">{title}</span>
    {rows.map(([label, value]) => (
      <div key={label} className="flex justify-between gap-3 py-1 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-right font-medium">{value}</span>
      </div>
    ))}
  </div>
)

const Stepper = ({ step }: { step: number }) => (
  <ol className="flex flex-wrap gap-3 px-4 pt-3 text-xs">
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
          {index < step ? '✓' : index + 1}
        </span>
        {label}
      </li>
    ))}
  </ol>
)

/** Simon's "Set investment" flow: opportunity and schedule, who invests, where it runs, review, proposed. */
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
  const [proposed, setProposed] = useState(false)
  const [pickedId, setPickedId] = useState(opportunity?.id ?? options[0]?.id ?? '')
  const [first, setFirst] = useState(String(IDLE_CASH.amount))
  const [schedule, setSchedule] = useState<Schedule>('once')
  const [each, setEach] = useState('100000')
  const [frequency, setFrequency] = useState<Frequency>('month')
  const [budget, setBudget] = useState('1000000')
  const [signers, setSigners] = useState<string[]>(owners)
  const [threshold, setThreshold] = useState(1)
  const [where, setWhere] = useState<Where>('dedicated')
  const [name, setName] = useState('')
  const picked = opportunity ?? options.find((item) => item.id === pickedId) ?? options[0]
  const safeName = name.trim() || (picked ? dedicatedSafeName(picked) : '')
  const amount = parseAmount(first)
  const budgetAmount = parseAmount(budget)
  const canContinue = [Boolean(picked) && amount > 0, signers.length > 0 && budgetAmount >= amount, true, true][step]

  if (!picked) return null

  const scheduleText =
    schedule === 'once' ? COPY.oneTime : COPY.recurring(formatAmount(parseAmount(each)), COPY.frequencies[frequency])

  const toggleSigner = (address: string) => {
    const next = signers.includes(address) ? signers.filter((item) => item !== address) : [...signers, address]
    setSigners(next)
    setThreshold((current) => Math.min(current, Math.max(next.length, 1)))
  }

  const close = () => {
    setStep(0)
    setProposed(false)
    setName('')
    onClose()
  }

  const submit = () => {
    if (where === 'dedicated') {
      onCreate({
        id: `dedicated-${picked.id}-${Date.now()}`,
        name: safeName,
        budget: budgetAmount,
        invested: 0,
        threshold,
        owners: signers.length,
        opportunityIds: [picked.id],
        recurring: schedule === 'recurring' ? { amount: parseAmount(each), frequency } : undefined,
      })
    }
    setProposed(true)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="sm" data-testid="set-up-investment">
        <DialogHeader divided="subtle">
          <div className="flex items-center gap-3">
            <OpportunityMark opportunity={picked} />
            <div className="flex min-w-0 flex-col">
              <DialogTitle>{COPY.newSafe}</DialogTitle>
              <DialogDescription>
                {COPY.flowLead(picked.name, picked.chains[0], formatApy(picked.apy))}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {proposed ? (
          <div className="flex flex-col gap-4 px-4 py-4" data-testid="investment-proposed">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-badge-dot-success" aria-hidden />
              <div className="flex flex-col gap-0.5">
                <Typography variant="paragraph-small-medium">{COPY.proposed}</Typography>
                <Typography variant="paragraph-small" color="muted">
                  {COPY.proposedNext(
                    COPY.signers(threshold, signers.length),
                    where === 'dedicated' ? safeName : COPY.thisSafe.toLowerCase(),
                  )}
                </Typography>
              </div>
            </div>
            <div className="flex flex-col rounded-lg bg-card">
              <div className="flex items-center justify-between px-3 py-2 text-sm font-medium">
                {COPY.waiting}
                <Badge variant="subtle">{COPY.signers(1, safe.threshold)}</Badge>
              </div>
              {owners.map((address, index) => (
                <div
                  key={address}
                  className={cn(
                    'flex items-center gap-2 border-t border-border px-3 py-2 text-sm',
                    index > 0 && 'text-muted-foreground',
                  )}
                >
                  {index === 0 ? (
                    <CheckCircle2 className="size-4 text-badge-dot-success" aria-hidden />
                  ) : (
                    <Circle className="size-4" aria-hidden />
                  )}
                  <span className="font-mono text-xs">{shortenAddress(address)}</span>
                  <span className="ml-auto text-xs">{index === 0 ? COPY.youSigned : COPY.pending}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <Stepper step={step} />
            <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-3">
              {step === 0 && (
                <>
                  {!opportunity && (
                    <Field label={COPY.investment}>
                      <RadioGroup
                        value={picked.id}
                        onValueChange={(next) => setPickedId(String(next))}
                        className="gap-1.5"
                      >
                        {options.map((option) => (
                          <Choice key={option.id} value={option.id} title={option.name} detail={option.exitShort} />
                        ))}
                      </RadioGroup>
                    </Field>
                  )}
                  <Field
                    label={COPY.firstDeposit}
                    htmlFor="investment-amount"
                    hint={DEFI_V1_COPY.deposit.fromValue(
                      IDLE_CASH.asset,
                      IDLE_CASH.chain,
                      formatAmount(IDLE_CASH.amount),
                    )}
                  >
                    <Input
                      id="investment-amount"
                      inputMode="decimal"
                      value={first}
                      onChange={(event) => setFirst(event.target.value)}
                    />
                  </Field>
                  <Field label={COPY.schedule}>
                    <RadioGroup
                      value={schedule}
                      onValueChange={(next) => setSchedule(next as Schedule)}
                      className="grid-cols-2 gap-1.5"
                    >
                      <Choice value="once" title={COPY.oneTime} />
                      <Choice
                        value="recurring"
                        title={COPY.recurringLabel}
                        badge={<Badge variant="warning">{COPY.later}</Badge>}
                      />
                    </RadioGroup>
                  </Field>
                  {schedule === 'recurring' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={COPY.addEach} htmlFor="investment-each">
                          <Input
                            id="investment-each"
                            inputMode="decimal"
                            value={each}
                            onChange={(event) => setEach(event.target.value)}
                          />
                        </Field>
                        <Field label={COPY.every}>
                          <RadioGroup
                            value={frequency}
                            onValueChange={(next) => setFrequency(next as Frequency)}
                            className="grid-cols-3 gap-1"
                          >
                            {FREQUENCIES.map((item) => (
                              <label
                                key={item}
                                className="flex cursor-pointer items-center gap-1.5 rounded-md bg-card px-2 py-2 text-xs"
                              >
                                <RadioGroupItem value={item} />
                                {COPY.frequencies[item]}
                              </label>
                            ))}
                          </RadioGroup>
                        </Field>
                      </div>
                      <Typography variant="paragraph-mini" color="muted">
                        {COPY.recurringNote(formatAmount(parseAmount(each)), picked.asset, COPY.frequencies[frequency])}
                      </Typography>
                    </>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <Field
                    label={COPY.budgetLabel}
                    htmlFor="investment-budget"
                    hint={where === 'dedicated' ? COPY.budgetHint : COPY.capHint}
                  >
                    <Input
                      id="investment-budget"
                      inputMode="decimal"
                      value={budget}
                      onChange={(event) => setBudget(event.target.value)}
                    />
                  </Field>
                  <Field label={COPY.signersLabel}>
                    <div className="flex flex-col gap-1 rounded-lg bg-card p-2">
                      {owners.map((address) => (
                        <label key={address} className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm">
                          <Checkbox checked={signers.includes(address)} onCheckedChange={() => toggleSigner(address)} />
                          <span className="font-mono text-xs">{shortenAddress(address)}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  <Field label={COPY.approvals}>
                    <RadioGroup
                      value={String(threshold)}
                      onValueChange={(next) => setThreshold(Number(next))}
                      className="grid-cols-3 gap-1.5"
                    >
                      {Array.from({ length: Math.max(signers.length, 1) }, (_, index) => index + 1).map((count) => (
                        <Choice key={count} value={String(count)} title={COPY.signers(count, signers.length)} />
                      ))}
                    </RadioGroup>
                  </Field>
                </>
              )}

              {step === 2 && (
                <Field label={COPY.madeFrom}>
                  <RadioGroup value={where} onValueChange={(next) => setWhere(next as Where)} className="gap-1.5">
                    <Choice
                      value="dedicated"
                      title={COPY.dedicated}
                      badge={<Badge variant="success">{COPY.recommended}</Badge>}
                      detail={COPY.dedicatedHint(safeName)}
                    >
                      {where === 'dedicated' && (
                        <span className="flex items-center gap-2">
                          <InitialsAvatar name={safeName} size="xsmall" rounded />
                          <Input
                            aria-label={COPY.name}
                            value={name}
                            maxLength={40}
                            placeholder={dedicatedSafeName(picked)}
                            onChange={(event) => setName(event.target.value)}
                          />
                        </span>
                      )}
                    </Choice>
                    <Choice
                      value="this"
                      title={COPY.thisSafe}
                      badge={<Badge variant="warning">{COPY.later}</Badge>}
                      detail={COPY.thisSafeCaveat}
                    />
                  </RadioGroup>
                </Field>
              )}

              {step === 3 && (
                <>
                  <div className="grid gap-2">
                    <ReviewPanel
                      title={COPY.investment}
                      rows={[
                        [COPY.investment, picked.name],
                        [COPY.firstDeposit, `${formatAmount(amount)} ${picked.asset}`],
                        [COPY.schedule, scheduleText],
                        [COPY.budgetLabel, formatAmount(budgetAmount)],
                      ]}
                    />
                    <ReviewPanel
                      title={COPY.controlHeading}
                      rows={[
                        [COPY.approvals, COPY.signers(threshold, signers.length)],
                        [COPY.runsFrom, where === 'dedicated' ? safeName : COPY.thisSafe],
                        [COPY.allowedActions, COPY.allowedValue(picked.name)],
                        [COPY.approval, COPY.approvalValue(safe.threshold, owners.length)],
                      ]}
                    />
                  </div>
                  <Field label={COPY.steps}>
                    <ol className="flex list-decimal flex-col gap-1 rounded-lg bg-card py-2 pr-3 pl-8 text-sm">
                      {where === 'dedicated' && <li>{COPY.stepCreate(safeName, threshold, signers.length)}</li>}
                      {where === 'dedicated' && <li>{COPY.stepMove(formatAmount(amount), picked.asset)}</li>}
                      <li>{COPY.stepDeposit(formatAmount(amount), picked.asset, picked.name)}</li>
                    </ol>
                  </Field>
                  <Typography variant="paragraph-mini" color="muted">
                    {COPY.guardNote}
                  </Typography>
                </>
              )}
            </div>
          </>
        )}

        <DialogFooter divided="subtle">
          {proposed ? (
            <Button size="lg" onClick={close}>
              {COPY.done}
            </Button>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
