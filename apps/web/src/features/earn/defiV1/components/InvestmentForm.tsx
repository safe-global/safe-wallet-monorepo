import { useState, type ReactNode } from 'react'
import { CheckCircle2, Circle, Info } from 'lucide-react'
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

const parseAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0

/** Form state shared by the dialog and drawer versions of set up investment. */
export const useInvestmentForm = (opportunity: Opportunity | null, options: Opportunity[]) => {
  const { safe } = useSafeInfo()
  const owners = safe.owners.map((owner) => owner.value)
  const [pickedId, setPickedId] = useState(opportunity?.id ?? options[0]?.id ?? '')
  const [first, setFirst] = useState(String(IDLE_CASH.amount))
  const [where, setWhere] = useState<Where>('nested')
  const [name, setName] = useState('')
  const [who, setWho] = useState<Who>('any')
  const [picked, setPicked] = useState<string[]>(owners.slice(0, 2))
  const [budget, setBudget] = useState('1000000')
  const [schedule, setSchedule] = useState<Schedule>('once')
  const [each, setEach] = useState('100000')
  const [frequency, setFrequency] = useState<Frequency>('month')
  const investment = opportunity ?? options.find((item) => item.id === pickedId) ?? options[0]
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

  const steps = investment
    ? [
        ...(where === 'nested'
          ? [COPY.stepCreate(safeName, 1, executors.length), COPY.stepMove(formatAmount(amount), investment.asset)]
          : []),
        COPY.stepDeposit(formatAmount(amount), investment.asset, investment.name),
      ]
    : []

  const reviewSteps = investment
    ? [
        ...(where === 'nested'
          ? [COPY.reviewStep.create(safeName), COPY.reviewStep.move(formatAmount(amount), investment.asset)]
          : []),
        COPY.reviewStep.deposit(formatAmount(amount), investment.asset, investment.name),
      ]
    : []

  return {
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
    steps,
    toOperation,
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

export const AmountFields = ({ form }: { form: InvestmentForm }) => (
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
  </>
)

export const WhereFields = ({ form, labelled = true }: { form: InvestmentForm; labelled?: boolean }) => (
  <>
    <Section label={labelled ? COPY.madeFrom : undefined}>
      <RadioGroup value={form.where} onValueChange={(next) => form.setWhere(next as Where)} className="gap-2">
        <ChoiceCard
          value="this"
          title={COPY.thisSafe}
          badge={<Badge variant="warning">{COPY.later}</Badge>}
          description={COPY.thisSafeCaveat}
        />
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
      <ChoiceCard
        value="recurring"
        title={COPY.recurringLabel}
        badge={<Badge variant="warning">{COPY.later}</Badge>}
        description={COPY.recurringHint}
      >
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

/** The proposal in plain steps, with one note on what is at risk. */
export const StepsSummary = ({ form }: { form: InvestmentForm }) =>
  form.investment ? (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col rounded-lg bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-sm">
          <span className="font-medium">{COPY.proposalTitle}</span>
          <span className="text-muted-foreground">{COPY.approvedBy(form.safe.threshold, form.owners.length)}</span>
        </div>
        <ol className="flex flex-col gap-2.5 px-3 py-3">
          {form.reviewSteps.map((step, index) => (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {COPY.riskNote}
      </p>
    </div>
  ) : null

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

/** Every answer from the earlier steps, then what happens once signers approve the proposal. */
export const ReviewSummary = ({ form, onEdit }: { form: InvestmentForm; onEdit?: (step: number) => void }) => {
  const { investment } = form
  if (!investment) return null
  const asset = investment.asset
  const amount = formatAmount(form.amount)
  const budget = formatAmount(form.budgetAmount)
  const count = form.executors.length
  const isNested = form.where === 'nested'
  const edit = (step: number) => (onEdit ? () => onEdit(step) : undefined)
  const outcomes = [
    isNested ? SUMMARY.create(form.safeName, count) : SUMMARY.allow(count, budget, asset),
    ...(isNested ? [SUMMARY.move(amount, asset)] : []),
    SUMMARY.deposit(amount, asset, investment.name),
    ...(form.schedule === 'recurring'
      ? [SUMMARY.repeat(formatAmount(parseAmount(form.each)), asset, COPY.frequencies[form.frequency])]
      : []),
  ]

  return (
    <div className="flex flex-col gap-4" data-testid="investment-review">
      <p className="text-sm text-muted-foreground">{SUMMARY.lead(form.safe.threshold, form.owners.length)}</p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{SUMMARY.setup}</span>
        <div className="flex flex-col rounded-lg border border-border">
          <SummaryRow
            label={SUMMARY.rows.investment}
            value={SUMMARY.investment(amount, asset, investment.name)}
            onEdit={edit(0)}
          />
          <SummaryRow
            label={SUMMARY.rows.safe}
            value={isNested ? SUMMARY.nested(form.safeName) : COPY.thisSafe}
            onEdit={edit(1)}
          />
          <SummaryRow
            label={SUMMARY.rows.who}
            value={form.who === 'any' ? SUMMARY.anyone : SUMMARY.some(count)}
            onEdit={edit(2)}
          />
          <SummaryRow label={SUMMARY.rows.budget} value={SUMMARY.budget(budget, asset)} onEdit={edit(3)} />
          <SummaryRow
            label={SUMMARY.rows.schedule}
            value={form.schedule === 'once' ? COPY.oneTime : form.scheduleText}
            onEdit={edit(3)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{SUMMARY.onApprove(form.safe.threshold, form.owners.length)}</span>
        <ol className="flex flex-col gap-2.5 rounded-lg bg-card px-3 py-3">
          {outcomes.map((step, index) => (
            <li key={step} className="flex items-center gap-3 text-sm">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">
          {SUMMARY.after(form.who === 'any' ? SUMMARY.anyoneWho : SUMMARY.someWho(count), budget, asset)}
        </p>
      </div>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {isNested ? SUMMARY.nestedRisk(form.safeName) : SUMMARY.thisRisk}
      </p>
    </div>
  )
}

export const ProposedView = ({ form }: { form: InvestmentForm }) => (
  <div className="flex flex-col gap-4" data-testid="investment-proposed">
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-badge-dot-success" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <Typography variant="paragraph-small-medium">{COPY.proposed}</Typography>
        <Typography variant="paragraph-small" color="muted">
          {COPY.proposedNext(
            form.who === 'any' ? SUMMARY.anyoneWho : SUMMARY.someWho(form.executors.length),
            form.where === 'nested' ? form.safeName : SUMMARY.inThisSafe,
          )}
        </Typography>
      </div>
    </div>
    <div className="flex flex-col rounded-lg bg-card">
      <div className="flex items-center justify-between px-3 py-2 text-sm font-medium">
        {COPY.waiting}
        <Badge variant="subtle">{COPY.signatures(1, form.safe.threshold)}</Badge>
      </div>
      {form.owners.map((address, index) => (
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
)
