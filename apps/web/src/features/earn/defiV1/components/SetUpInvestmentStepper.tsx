import { Fragment, useState, type ReactNode } from 'react'
import { Check, Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd } from '../copy'
import type { Opportunity } from '../types'
import {
  AmountFields,
  BudgetFields,
  ProposedActions,
  ProposedView,
  ScheduleFields,
  ReviewSummary,
  useInvestmentForm,
  WhereFields,
  WhoFields,
  type CreatedInvestment,
  type InvestmentForm,
} from './InvestmentForm'
import { OpportunityMark } from './TreasuryTables'

const COPY = DEFI_V1_COPY.operations

type StepState = 'done' | 'current' | 'upcoming'

const compact = (value: number) => formatCompactUsd(value).replace('$', '')

const depositSummary = (form: InvestmentForm) => `${compact(form.amount)} ${form.investment?.asset ?? ''}`.trim()

const Stepper = ({
  steps,
  current,
  reached,
  labels,
  onJump,
}: {
  steps: string[]
  current: number
  reached: number
  labels: string[]
  onJump: (index: number) => void
}) => (
  <ol className="flex items-start pb-1" data-testid="investment-stepper">
    {steps.map((title, index) => {
      const state: StepState = index === current ? 'current' : index <= reached ? 'done' : 'upcoming'
      const canJump = state === 'done'
      return (
        <Fragment key={title}>
          <li className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
            <button
              type="button"
              disabled={!canJump}
              onClick={() => onJump(index)}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
                state === 'done' && 'cursor-pointer bg-foreground text-background hover:opacity-80',
                state === 'current' && 'bg-background text-foreground ring-[1.5px] ring-foreground',
                state === 'upcoming' && 'bg-muted text-muted-foreground',
              )}
            >
              {state === 'done' ? <Check className="size-3" /> : index + 1}
            </button>
            <span
              className={cn('text-sm font-medium', state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground')}
            >
              {title}
            </span>
            <span className="min-h-4 max-w-full truncate text-xs leading-4 text-muted-foreground">
              {state === 'done' ? labels[index] : ''}
            </span>
          </li>
          {index < steps.length - 1 && (
            <span className={cn('mt-2.5 h-px flex-1', index < reached ? 'bg-foreground' : 'bg-border')} aria-hidden />
          )}
        </Fragment>
      )
    })}
  </ol>
)

const ProHint = () => (
  <p
    className="flex items-start gap-2 rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground"
    data-testid="pro-hint"
  >
    <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
    <span>
      {COPY.proHint} <span className="font-medium text-foreground">{DEFI_V1_COPY.seePro}</span>
    </span>
  </p>
)

type View = { step: string; summary: string; heading?: string; content: ReactNode; valid: boolean }

/**
 * Start earning one step at a time. With `nested` (Safe Pro) it adds where the deposits run, who can deposit
 * and a budget; without it, it deposits from this Safe and goes straight to review.
 */
export const SetUpInvestmentFlow = ({
  opportunity,
  options,
  nested,
  safes,
  onClose,
  onCreate,
  onView,
  tabs,
}: {
  opportunity: Opportunity | null
  options: Opportunity[]
  nested: boolean
  safes?: string[]
  onClose: () => void
  onCreate: (created: CreatedInvestment) => void
  onView: (opportunity: Opportunity) => void
  tabs?: ReactNode
}) => {
  const form = useInvestmentForm(opportunity, options, { nested, safes })
  const [current, setCurrent] = useState(0)
  const [reached, setReached] = useState(0)
  const [proposed, setProposed] = useState(false)
  const { investment } = form

  if (!investment) return null

  const [depositStep, safeStep, signersStep, budgetStep, reviewStep] = COPY.stepperSteps
  const first: View = {
    step: depositStep,
    summary: depositSummary(form),
    content: (
      <>
        <AmountFields form={form} cards />
        {!nested && <ProHint />}
      </>
    ),
    valid: form.amount > 0,
  }
  const review: View = {
    step: reviewStep,
    summary: '',
    heading: COPY.stepHeadings[3],
    content: <ReviewSummary form={form} onEdit={setCurrent} />,
    valid: form.isValid,
  }
  const views: View[] = nested
    ? [
        first,
        {
          step: safeStep,
          summary: form.where === 'nested' ? COPY.short.nested : COPY.short.thisSafe,
          heading: COPY.stepHeadings[0],
          content: <WhereFields form={form} labelled={false} />,
          valid: true,
        },
        {
          step: signersStep,
          summary: form.who === 'any' ? COPY.anySigner : COPY.short.signers(form.executors.length),
          heading: COPY.stepHeadings[1],
          content: <WhoFields form={form} labelled={false} />,
          valid: form.executors.length > 0,
        },
        {
          step: budgetStep,
          summary: `${compact(form.budgetAmount)}, ${form.schedule === 'once' ? COPY.short.once : COPY.short.recurring}`,
          heading: COPY.stepHeadings[2],
          content: (
            <>
              <BudgetFields form={form} />
              <ScheduleFields form={form} />
            </>
          ),
          valid: form.budgetAmount >= form.amount,
        },
        review,
      ]
    : [first, review]
  const view = views[current]
  const isLast = current === views.length - 1

  const close = () => {
    setCurrent(0)
    setReached(0)
    setProposed(false)
    form.reset()
    onClose()
  }

  const next = () => {
    if (isLast) {
      const created = form.toCreated()
      if (created) onCreate(created)
      setProposed(true)
      return
    }
    setCurrent(current + 1)
    setReached(Math.max(reached, current + 1))
  }

  return (
    <>
      {proposed ? (
        <DialogTitle className="sr-only">{COPY.proposed}</DialogTitle>
      ) : (
        <DialogHeader divided="subtle">
          <div className="flex items-center gap-3">
            <OpportunityMark />
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <DialogTitle>{COPY.newSafe}</DialogTitle>
                {form.amount > 0 && (
                  <Badge variant="brand" className="tabular-nums">
                    {`${compact(form.amount)} ${investment.asset}`}
                  </Badge>
                )}
              </div>
              <DialogDescription>
                {COPY.flowLead(investment.name, investment.chains[0], formatApy(investment.apy))}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
      )}

      {proposed ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ProposedView form={form} />
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 flex flex-col gap-4 px-4 pt-4">
            {tabs && current === 0 && tabs}
            {view.heading && (
              <Typography variant="paragraph-bold" className="shrink-0">
                {view.heading}
              </Typography>
            )}
            <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">{view.content}</div>
          </div>
        </>
      )}

      <DialogFooter divided="subtle">
        {proposed ? (
          <ProposedActions
            onClose={close}
            onView={() => {
              close()
              onView(investment)
            }}
          />
        ) : (
          <>
            <Stepper
              steps={views.map((item) => item.step)}
              current={current}
              reached={reached}
              labels={views.map((item) => item.summary)}
              onJump={setCurrent}
            />
            <div className="flex gap-2">
              {current > 0 && (
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setCurrent(current - 1)}>
                  {COPY.back}
                </Button>
              )}
              <Button size="lg" className="flex-1" disabled={!view.valid} onClick={next}>
                {isLast ? COPY.submit : COPY.next}
              </Button>
            </div>
          </>
        )}
      </DialogFooter>
    </>
  )
}
