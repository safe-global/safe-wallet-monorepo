import { useState, type ReactNode } from 'react'
import {
  ArrowRightLeft,
  CheckCircle2,
  Coins,
  Info,
  type LucideIcon,
  Repeat,
  ShieldCheck,
  ShieldPlus,
  UserCheck,
  Zap,
} from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@safe-global/views/components/ui/field'
import { Input } from '@safe-global/views/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@safe-global/views/components/ui/input-group'
import { Label } from '@safe-global/views/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@safe-global/views/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import Identicon from '@safe-global/views/components/common/Identicon'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatAmount, formatApy } from '../copy'
import { IDLE_CASH } from '../opportunities'
import { dedicatedSafeName } from '../shelf'
import type { Frequency, Operation, Opportunity } from '../types'

const COPY = DEFI_V1_COPY.operations
const SUMMARY = COPY.summary
const FREQUENCIES = Object.keys(COPY.frequencies) as Frequency[]

type Where = 'nested' | 'this'
type Who = 'any' | 'some'
type Schedule = 'once' | 'recurring'

export type CreatedInvestment = { operation?: Operation; opportunity: Opportunity; amount: number; safe?: string }

const parseAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0

/** `nested` offers a nested Safe with its own signers and budget (Safe Pro); `safes` lets a workspace pick the Safe to deposit from. */
export const useInvestmentForm = (
  opportunity: Opportunity | null,
  options: Opportunity[],
  { nested = true, safes }: { nested?: boolean; safes?: string[] } = {},
) => {
  const { safe } = useSafeInfo()
  const owners = safe.owners.map((owner) => owner.value)
  const [pickedId, setPickedId] = useState(opportunity?.id ?? options[0]?.id ?? '')
  const [first, setFirst] = useState(String(IDLE_CASH.amount))
  const [where, setWhere] = useState<Where>(nested ? 'nested' : 'this')
  const [fromSafe, setFromSafe] = useState(safes?.[0])
  const [name, setName] = useState('')
  const [who, setWho] = useState<Who>('any')
  const [picked, setPicked] = useState<string[]>(owners.slice(0, 2))
  const [budget, setBudget] = useState('1000000')
  const [schedule, setSchedule] = useState<Schedule>('once')
  const [each, setEach] = useState('100000')
  const [frequency, setFrequency] = useState<Frequency>('month')
  const investment = options.find((item) => item.id === pickedId) ?? opportunity ?? options[0]
  const safeName = name.trim() || (investment ? dedicatedSafeName(investment) : '')
  const amount = parseAmount(first)
  const budgetAmount = parseAmount(budget)
  const executors = who === 'any' ? owners : picked
  const scheduleText =
    schedule === 'once' ? COPY.oneTime : COPY.recurring(formatAmount(parseAmount(each)), COPY.frequencies[frequency])

  const togglePicked = (address: string) =>
    setPicked((current) =>
      current.includes(address) ? current.filter((item) => item !== address) : [...current, address],
    )

  const toOperation = (): Operation | undefined =>
    investment && where === 'nested'
      ? {
          id: `dedicated-${investment.id}-${Date.now()}`,
          name: safeName,
          budget: budgetAmount,
          invested: 0,
          threshold: 1,
          owners: executors.length,
          opportunityIds: [investment.id],
          recurring: schedule === 'recurring' ? { amount: parseAmount(each), frequency } : undefined,
        }
      : undefined

  const toCreated = (): CreatedInvestment | undefined =>
    investment ? { operation: toOperation(), opportunity: investment, amount, safe: fromSafe } : undefined

  const reviewSteps = investment
    ? [
        ...(where === 'nested'
          ? [COPY.reviewStep.create(safeName), COPY.reviewStep.move(formatAmount(amount), investment.asset)]
          : []),
        COPY.reviewStep.deposit(formatAmount(amount), investment.asset, investment.name),
      ]
    : []

  return {
    nested,
    safes,
    fromSafe,
    setFromSafe,
    reviewSteps,
    safe,
    owners,
    opportunity,
    options,
    investment,
    pickedId: investment?.id ?? pickedId,
    setPickedId,
    first,
    setFirst,
    amount,
    where,
    setWhere,
    name,
    setName,
    safeName,
    who,
    setWho,
    picked,
    togglePicked,
    executors,
    budget,
    setBudget,
    budgetAmount,
    schedule,
    setSchedule,
    each,
    setEach,
    frequency,
    setFrequency,
    scheduleText,
    toOperation,
    toCreated,
    reset: () => setName(''),
    isValid: Boolean(investment) && amount > 0 && executors.length > 0 && budgetAmount >= amount,
  }
}

export type InvestmentForm = ReturnType<typeof useInvestmentForm>

/** The library's choice card: a radio inside a bordered label that highlights when picked. */
export const ChoiceCard = ({
  value,
  title,
  description,
  badge,
  children,
}: {
  value: string
  title: string
  description?: string
  badge?: ReactNode
  children?: ReactNode
}) => (
  <FieldLabel>
    <Field orientation="horizontal">
      <RadioGroupItem value={value} />
      <FieldContent>
        <FieldTitle>
          {title}
          {badge}
        </FieldTitle>
        {description && <FieldDescription className="text-xs">{description}</FieldDescription>}
        {children}
      </FieldContent>
    </Field>
  </FieldLabel>
)

export const Section = ({
  label,
  hint,
  htmlFor,
  children,
}: {
  label?: string
  hint?: string
  htmlFor?: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground uppercase">
        {label}
      </Label>
    )}
    {children}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>
)

const optionLabel = (option: Opportunity) => `${option.name} · ${formatApy(option.apy)} · ${option.exitShort}`

const AmountInput = ({ form }: { form: InvestmentForm }) => (
  <Section
    label={COPY.firstDeposit}
    htmlFor="investment-amount"
    hint={DEFI_V1_COPY.deposit.fromValue(IDLE_CASH.asset, IDLE_CASH.chain, formatAmount(IDLE_CASH.amount))}
  >
    <Input
      id="investment-amount"
      inputMode="decimal"
      value={form.first}
      onChange={(event) => form.setFirst(event.target.value)}
    />
  </Section>
)

const InvestmentCards = ({ form }: { form: InvestmentForm }) => (
  <Section label={COPY.investment}>
    <RadioGroup
      aria-label={COPY.investment}
      value={form.pickedId}
      onValueChange={(next) => form.setPickedId(String(next))}
      className="gap-2"
    >
      {form.options.map((option) => (
        <ChoiceCard
          key={option.id}
          value={option.id}
          title={option.name}
          badge={<span className="ml-auto tabular-nums">{formatApy(option.apy)}</span>}
          description={`${option.asset} · ${option.runBy} · ${option.exitShort}`}
        />
      ))}
    </RadioGroup>
  </Section>
)

const FromField = ({ form }: { form: InvestmentForm }) =>
  form.safes && form.safes.length > 1 ? (
    <Section label={SUMMARY.rows.from}>
      <Select
        items={form.safes.map((name) => ({ value: name, label: name }))}
        value={form.fromSafe}
        onValueChange={(next) => next && form.setFromSafe(String(next))}
      >
        <SelectTrigger aria-label={SUMMARY.rows.from} className="w-full" data-testid="deposit-from">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {form.safes.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Section>
  ) : null

/** `cards` puts the amount first and lists the opportunities as radio cards. */
export const AmountFields = ({ form, cards }: { form: InvestmentForm; cards?: boolean }) => {
  if (cards)
    return (
      <>
        <FromField form={form} />
        <AmountInput form={form} />
        <InvestmentCards form={form} />
      </>
    )
  return (
    <>
      {!form.opportunity && (
        <Section label={COPY.investment}>
          <Select
            items={form.options.map((option) => ({ value: option.id, label: optionLabel(option) }))}
            value={form.pickedId}
            onValueChange={(next) => next && form.setPickedId(String(next))}
          >
            <SelectTrigger aria-label={COPY.investment} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {form.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {optionLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Section>
      )}
      <AmountInput form={form} />
    </>
  )
}

export const WhereFields = ({ form, labelled = true }: { form: InvestmentForm; labelled?: boolean }) => (
  <>
    <Section label={labelled ? COPY.madeFrom : undefined}>
      <RadioGroup value={form.where} onValueChange={(next) => form.setWhere(next as Where)} className="gap-2">
        <ChoiceCard value="this" title={COPY.thisSafe} description={COPY.thisSafeCaveat} />
        <ChoiceCard
          value="nested"
          title={COPY.dedicated}
          badge={<Badge variant="success">{COPY.recommended}</Badge>}
          description={COPY.dedicatedHint(form.safeName)}
        >
          {form.where === 'nested' && form.investment && (
            <div className="mt-2 flex flex-col gap-1.5">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InitialsAvatar name={form.safeName} size="xsmall" rounded />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label={COPY.name}
                  value={form.name}
                  maxLength={40}
                  placeholder={dedicatedSafeName(form.investment)}
                  onChange={(event) => form.setName(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <Tooltip delay={150}>
                    <TooltipTrigger
                      render={
                        <span
                          className="flex text-muted-foreground"
                          aria-label={COPY.nameHint(form.executors.length)}
                        />
                      }
                    >
                      <Info className="size-4" aria-hidden />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">{COPY.nameHint(form.executors.length)}</TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>
            </div>
          )}
        </ChoiceCard>
      </RadioGroup>
    </Section>
  </>
)

export const WhoFields = ({ form, labelled = true }: { form: InvestmentForm; labelled?: boolean }) => (
  <Section label={labelled ? COPY.who : undefined}>
    <RadioGroup value={form.who} onValueChange={(next) => form.setWho(next as Who)} className="gap-2">
      <ChoiceCard value="any" title={COPY.anySigner} description={COPY.allSigners(form.owners.length)} />
      <ChoiceCard value="some" title={COPY.specificSigners} description={COPY.specificHint}>
        {form.who === 'some' && (
          <div className="mt-2 flex flex-col gap-1 rounded-md bg-background p-2">
            {form.owners.map((address) => (
              <span key={address} className="flex items-center gap-2 px-1 py-1 text-sm">
                <Checkbox
                  checked={form.picked.includes(address)}
                  onCheckedChange={() => form.togglePicked(address)}
                  aria-label={shortenAddress(address)}
                />
                <span className="font-mono text-xs">{shortenAddress(address)}</span>
              </span>
            ))}
          </div>
        )}
      </ChoiceCard>
    </RadioGroup>
  </Section>
)

export const BudgetFields = ({ form }: { form: InvestmentForm }) => (
  <Section
    label={COPY.budgetLabel}
    htmlFor="investment-budget"
    hint={form.where === 'nested' ? COPY.budgetHint : COPY.capHint}
  >
    <Input
      id="investment-budget"
      inputMode="decimal"
      value={form.budget}
      onChange={(event) => form.setBudget(event.target.value)}
    />
  </Section>
)

export const ScheduleFields = ({ form }: { form: InvestmentForm }) => (
  <Section label={COPY.schedule}>
    <RadioGroup value={form.schedule} onValueChange={(next) => form.setSchedule(next as Schedule)} className="gap-2">
      <ChoiceCard value="once" title={COPY.oneTime} description={COPY.oneTimeHint} />
      <ChoiceCard value="recurring" title={COPY.recurringLabel} description={COPY.recurringHint}>
        {form.schedule === 'recurring' && form.investment && (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <InputGroup className="flex-1">
                <InputGroupInput
                  aria-label={COPY.addEach}
                  inputMode="decimal"
                  value={form.each}
                  onChange={(event) => form.setEach(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{form.investment.asset}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <span className="shrink-0 text-sm text-muted-foreground">{COPY.every.toLowerCase()}</span>
              <Select
                items={FREQUENCIES.map((item) => ({ value: item, label: COPY.frequencies[item].toLowerCase() }))}
                value={form.frequency}
                onValueChange={(next) => next && form.setFrequency(next as Frequency)}
              >
                <SelectTrigger aria-label={COPY.every} className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {COPY.frequencies[item].toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-xs text-muted-foreground">
              {COPY.recurringNote(
                formatAmount(parseAmount(form.each)),
                form.investment.asset,
                COPY.frequencies[form.frequency],
              )}
            </span>
          </div>
        )}
      </ChoiceCard>
    </RadioGroup>
  </Section>
)

const SummaryRow = ({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) => (
  <div className="flex min-h-11 items-center gap-3 border-t border-border px-3 py-1.5 text-sm first:border-t-0">
    <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
    <span className="min-w-0 flex-1 truncate font-medium">{value}</span>
    {onEdit && (
      <Button variant="ghost" size="xs" onClick={onEdit}>
        {COPY.edit}
      </Button>
    )}
  </div>
)

/** One row per answer; with onEdit each row links back to its step. */
const SetupCard = ({ form, onEdit }: { form: InvestmentForm; onEdit?: (step: number) => void }) => {
  if (!form.investment) return null
  const asset = form.investment.asset
  const edit = (step: number) => (onEdit ? () => onEdit(step) : undefined)
  const deposit = (
    <SummaryRow
      label={SUMMARY.rows.investment}
      value={SUMMARY.investment(formatAmount(form.amount), asset, form.investment.name)}
      onEdit={edit(0)}
    />
  )
  const from = form.fromSafe && <SummaryRow label={SUMMARY.rows.from} value={form.fromSafe} onEdit={edit(0)} />

  if (!form.nested)
    return (
      <div className="flex flex-col rounded-lg border border-border">
        {deposit}
        {from}
        <SummaryRow label={SUMMARY.rows.safe} value={SUMMARY.thisSafe(form.safe.threshold, form.owners.length)} />
      </div>
    )

  return (
    <div className="flex flex-col rounded-lg border border-border">
      {deposit}
      {from}
      <SummaryRow
        label={SUMMARY.rows.safe}
        value={form.where === 'nested' ? SUMMARY.nested(form.safeName) : COPY.thisSafe}
        onEdit={edit(1)}
      />
      <SummaryRow
        label={SUMMARY.rows.who}
        value={form.who === 'any' ? SUMMARY.anyone : SUMMARY.some(form.executors.length)}
        onEdit={edit(2)}
      />
      <SummaryRow
        label={SUMMARY.rows.budget}
        value={SUMMARY.budget(formatAmount(form.budgetAmount), asset)}
        onEdit={edit(3)}
      />
      <SummaryRow
        label={SUMMARY.rows.schedule}
        value={form.schedule === 'once' ? COPY.oneTime : form.scheduleText}
        onEdit={edit(3)}
      />
    </div>
  )
}

/** Every answer from the earlier steps, then what happens once signers approve the proposal. */
export const ReviewSummary = ({ form, onEdit }: { form: InvestmentForm; onEdit?: (step: number) => void }) => {
  const { investment } = form
  if (!investment) return null
  const asset = investment.asset
  const amount = formatAmount(form.amount)
  const budget = formatAmount(form.budgetAmount)
  const count = form.executors.length
  const isNested = form.where === 'nested'
  const outcomes: { icon: LucideIcon; text: string }[] = !form.nested
    ? [{ icon: Coins, text: SUMMARY.deposit(amount, asset, investment.name) }]
    : [
        isNested
          ? { icon: ShieldPlus, text: SUMMARY.create(form.safeName, count) }
          : { icon: UserCheck, text: SUMMARY.allow(count, budget, asset) },
        ...(isNested ? [{ icon: ArrowRightLeft, text: SUMMARY.move(amount, asset) }] : []),
        { icon: Coins, text: SUMMARY.deposit(amount, asset, investment.name) },
        ...(form.schedule === 'recurring'
          ? [
              {
                icon: Repeat,
                text: SUMMARY.repeat(formatAmount(parseAmount(form.each)), asset, COPY.frequencies[form.frequency]),
              },
            ]
          : []),
      ]

  return (
    <div className="flex flex-col gap-4" data-testid="investment-review">
      <p className="text-sm text-muted-foreground">{SUMMARY.lead(form.safe.threshold, form.owners.length)}</p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{SUMMARY.setup}</span>
        <SetupCard form={form} onEdit={onEdit} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{SUMMARY.onApprove(form.safe.threshold, form.owners.length)}</span>
        <div className="flex flex-col rounded-lg bg-card">
          <ol className="flex flex-col px-3 pt-3">
            {outcomes.map(({ icon: Icon, text }, index) => (
              <li key={text} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {index < outcomes.length - 1 && <span aria-hidden className="w-px flex-1 bg-border" />}
                </div>
                <span className="pt-0.5 pb-3 text-sm">{text}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 border-t border-border/60 px-3 py-3 text-xs text-muted-foreground">
            {form.nested && (
              <p className="flex items-start gap-2">
                <Zap className="size-3.5 shrink-0 translate-y-px text-badge-dot-success" aria-hidden />
                {SUMMARY.after(form.who === 'any' ? SUMMARY.anyoneWho : SUMMARY.someWho(count), budget, asset)}
              </p>
            )}
            <p className="flex items-start gap-2">
              <ShieldCheck className="size-3.5 shrink-0 translate-y-px" aria-hidden />
              {!form.nested ? SUMMARY.returnOnly : isNested ? SUMMARY.nestedRisk(form.safeName) : SUMMARY.thisRisk}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The moment after proposing: what was set up, what it should earn, and who still needs to sign. */
export const ProposedView = ({ form }: { form: InvestmentForm }) => {
  const { investment } = form
  if (!investment) return null
  const threshold = form.safe.threshold
  return (
    <div className="flex flex-col gap-5" data-testid="investment-proposed">
      <div className="relative -mx-4 -mt-4 flex flex-col items-center gap-4 overflow-hidden px-4 pt-6 pb-6 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-badge-dot-success)_0%,transparent_70%)] opacity-15"
        />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-badge-dot-success/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-success-tint text-badge-dot-success">
            <Coins className="size-6" aria-hidden />
          </span>
        </span>
        <div className="relative flex flex-col items-center gap-1">
          <Typography variant="paragraph-small-medium" color="success">
            {COPY.proposed}
          </Typography>
          <Typography variant="h2" className="tabular-nums">
            {formatAmount(form.amount)} {investment.asset}
          </Typography>
          <Typography variant="paragraph-small" color="muted">
            {investment.name} · {COPY.variableApy(formatApy(investment.apy))}
          </Typography>
        </div>
      </div>

      <SetupCard form={form} />

      <div className="flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{COPY.signatures(1, threshold)}</span>
          <span className="text-xs text-muted-foreground">{COPY.moreToApprove(Math.max(threshold - 1, 0))}</span>
        </div>
        <div className="flex -space-x-1.5">
          {form.owners.map((address, index) => (
            <Tooltip key={address} delay={150}>
              <TooltipTrigger
                render={
                  <span className={cn('relative flex rounded-full ring-2 ring-card', index > 0 && 'opacity-40')} />
                }
              >
                <Identicon address={address} size={24} />
                {index === 0 && (
                  <CheckCircle2
                    className="absolute -right-1 -bottom-1 size-3.5 rounded-full bg-card text-badge-dot-success"
                    aria-hidden
                  />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {shortenAddress(address)} · {index === 0 ? COPY.youSignedShort : COPY.pending}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Close, or jump straight to the deposit that was just proposed. */
export const ProposedActions = ({ onClose, onView }: { onClose: () => void; onView: () => void }) => (
  <div className="flex w-full gap-2">
    <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
      {COPY.close}
    </Button>
    <Button size="lg" className="flex-1" onClick={onView} data-testid="view-investment">
      {COPY.viewInvestment}
    </Button>
  </div>
)
