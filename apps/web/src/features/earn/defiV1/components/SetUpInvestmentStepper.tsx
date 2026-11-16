import { Fragment, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd } from '../copy'
import type { Operation, Opportunity } from '../types'
import {
  AmountFields,
  BudgetFields,
  ProposedView,
  ScheduleFields,
  ReviewSummary,
  useInvestmentForm,
  WhereFields,
  WhoFields,
  type InvestmentForm,
} from './InvestmentForm'
import { OpportunityMark } from './TreasuryTables'

const COPY = DEFI_V1_COPY.operations
const STEPS = COPY.stepperSteps
/** Fixed so the dialog never changes size between steps; long lists scroll inside it. */
const BODY_HEIGHT = 'h-[min(26rem,60vh)]'

type StepState = 'done' | 'current' | 'upcoming'

const compact = (value: number) => formatCompactUsd(value).replace('$', '')

/** One or two words per step, so the stepper reads as a summary of the choices so far. */
const summaries = (form: InvestmentForm): string[] => [
  `${compact(form.amount)} ${form.investment?.asset ?? ''}`.trim(),
  form.where === 'nested' ? COPY.short.nested : COPY.short.thisSafe,
  form.who === 'any' ? COPY.anySigner : COPY.short.signers(form.executors.length),
  `${compact(form.budgetAmount)}, ${form.schedule === 'once' ? COPY.short.once : COPY.short.recurring}`,
  '',
]

const Stepper = ({
  current,
  reached,
  labels,
  onJump,
}: {
  current: number
  reached: number
  labels: string[]
  onJump: (index: number) => void
}) => (
  <ol className="flex items-start pb-1" data-testid="investment-stepper">
    {STEPS.map((title, index) => {
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
          {index < STEPS.length - 1 && (
            <span className={cn('mt-2.5 h-px flex-1', index < reached ? 'bg-foreground' : 'bg-border')} aria-hidden />
          )}
        </Fragment>
      )
    })}
  </ol>
)

/** Set up investment in a centred dialog: one clear step at a time, with a stepper that summarises each answer. */
export const SetUpInvestmentStepper = ({
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
  const form = useInvestmentForm(opportunity, options)
  const [current, setCurrent] = useState(0)
  const [reached, setReached] = useState(0)
  const [proposed, setProposed] = useState(false)
  const { investment } = form

  if (!investment) return null

  const views: { heading: string; content: ReactNode; valid: boolean }[] = [
    { heading: COPY.stepHeadings[0], content: <AmountFields form={form} />, valid: form.amount > 0 },
    { heading: COPY.stepHeadings[1], content: <WhereFields form={form} labelled={false} />, valid: true },
    {
      heading: COPY.stepHeadings[2],
      content: <WhoFields form={form} labelled={false} />,
      valid: form.executors.length > 0,
    },
    {
      heading: COPY.stepHeadings[3],
      content: (
        <>
          <BudgetFields form={form} />
          <ScheduleFields form={form} />
        </>
      ),
      valid: form.budgetAmount >= form.amount,
    },
    {
      heading: COPY.stepHeadings[4],
      content: (
        <>
          <ReviewSummary form={form} />
          <Typography variant="paragraph-small" color="muted">
            {COPY.approveOnce(form.safe.threshold, form.owners.length)}
          </Typography>
        </>
      ),
      valid: form.isValid,
    },
  ]
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
      const operation = form.toOperation()
      if (operation) onCreate(operation)
      setProposed(true)
      return
    }
    setCurrent(current + 1)
    setReached(Math.max(reached, current + 1))
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && close()}>
      <DialogContent size="sm" data-testid="set-up-investment-stepper">
        <DialogHeader divided="subtle">
          <div className="flex items-center gap-3">
            <OpportunityMark opportunity={investment} />
            <div className="flex min-w-0 flex-col">
              <DialogTitle>{COPY.newSafe}</DialogTitle>
              <DialogDescription>
                {COPY.flowLead(investment.name, investment.chains[0], formatApy(investment.apy))}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {proposed ? (
          <div className={cn(BODY_HEIGHT, 'overflow-y-auto px-4 py-4')}>
            <ProposedView form={form} />
          </div>
        ) : (
          <>
            <div className={cn(BODY_HEIGHT, 'flex flex-col gap-4 px-4 pt-4')}>
              <Typography variant="paragraph-bold" className="shrink-0">
                {view.heading}
              </Typography>
              <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">{view.content}</div>
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
              <Stepper current={current} reached={reached} labels={summaries(form)} onJump={setCurrent} />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => (current === 0 ? close() : setCurrent(current - 1))}
                >
                  {current === 0 ? COPY.cancel : COPY.back}
                </Button>
                <Button size="lg" className="flex-1" disabled={!view.valid} onClick={next}>
                  {isLast ? COPY.submit : COPY.next}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
