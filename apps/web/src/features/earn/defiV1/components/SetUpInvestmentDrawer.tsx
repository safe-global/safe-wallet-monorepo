import { useState, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { Drawer, DrawerBody, DrawerFooter } from '@/components/common/Drawer'
import { DEFI_V1_COPY, formatAmount, formatApy } from '../copy'
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

type Step = { title: string; summary: (form: InvestmentForm) => string; content: ReactNode; valid: boolean }

const StepMarker = ({ index, state }: { index: number; state: 'done' | 'current' | 'upcoming' }) => (
  <span
    className={cn(
      'z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
      state === 'done' && 'bg-foreground text-background',
      state === 'current' && 'bg-background text-foreground ring-2 ring-foreground',
      state === 'upcoming' && 'bg-muted text-muted-foreground',
    )}
    aria-hidden
  >
    {state === 'done' ? <Check className="size-3.5" /> : index + 1}
  </span>
)

/** Set up investment as a side panel: a vertical stepper where finished steps show their answer and can be reopened. */
export const SetUpInvestmentDrawer = ({
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

  const steps: Step[] = [
    {
      title: COPY.investment,
      summary: (f) => `${formatAmount(f.amount)} ${investment.asset}`,
      content: <AmountFields form={form} labelled={false} />,
      valid: form.amount > 0,
    },
    {
      title: COPY.whereItRuns,
      summary: (f) => (f.where === 'nested' ? f.safeName : COPY.thisSafe),
      content: <WhereFields form={form} labelled={false} />,
      valid: true,
    },
    {
      title: COPY.who,
      summary: (f) => (f.who === 'any' ? COPY.allSigners(f.owners.length) : COPY.signers(1, f.executors.length)),
      content: <WhoFields form={form} labelled={false} />,
      valid: form.executors.length > 0,
    },
    {
      title: COPY.budgetAndSchedule,
      summary: (f) => `${formatAmount(f.budgetAmount)} · ${f.scheduleText}`,
      content: (
        <>
          <BudgetFields form={form} />
          <ScheduleFields form={form} />
        </>
      ),
      valid: form.budgetAmount >= form.amount,
    },
    {
      title: COPY.review,
      summary: () => '',
      content: <ReviewSummary form={form} />,
      valid: form.isValid,
    },
  ]
  const isLast = current === steps.length - 1

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
    <Drawer
      open={open}
      onClose={close}
      ariaLabel={COPY.newSafe}
      mobileFullScreen
      header={() => (
        <header className="flex items-center gap-3 px-6 pt-6">
          <OpportunityMark opportunity={investment} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Typography as="h2" variant="paragraph-bold" className="truncate leading-tight">
              {COPY.newSafe}
            </Typography>
            <span className="truncate text-xs text-muted-foreground">
              {COPY.flowLead(investment.name, investment.chains[0], formatApy(investment.apy))}
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={DEFI_V1_COPY.drawer.close} onClick={close}>
            <X />
          </Button>
        </header>
      )}
    >
      <DrawerBody>
        {proposed ? (
          <ProposedView form={form} />
        ) : (
          <ol className="relative flex flex-col pb-6" data-testid="investment-stepper">
            {steps.map((step, index) => {
              const state = index === current ? 'current' : index <= reached ? 'done' : 'upcoming'
              const isOpen = index === current
              return (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < steps.length - 1 && (
                    <span
                      className={cn(
                        'absolute top-7 bottom-1 left-3 w-px -translate-x-1/2',
                        index < reached ? 'bg-foreground' : 'bg-border',
                      )}
                      aria-hidden
                    />
                  )}
                  <StepMarker index={index} state={state} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex min-h-6 items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className={cn('text-sm font-medium', state === 'upcoming' && 'text-muted-foreground')}>
                          {step.title}
                        </span>
                        {!isOpen && state === 'done' && step.summary(form) && (
                          <span className="truncate text-xs text-muted-foreground">{step.summary(form)}</span>
                        )}
                      </div>
                      {!isOpen && state === 'done' && (
                        <Button variant="ghost" size="xs" onClick={() => setCurrent(index)}>
                          {COPY.edit}
                        </Button>
                      )}
                    </div>
                    {isOpen && (
                      <>
                        {step.content}
                        {!isLast && (
                          <Button className="self-start" disabled={!step.valid} onClick={next}>
                            {COPY.next}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </DrawerBody>
      <DrawerFooter>
        {proposed ? (
          <Button size="lg" className="w-full" onClick={close}>
            {COPY.done}
          </Button>
        ) : (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <Typography variant="paragraph-small" color="muted" align="center">
              {COPY.approveOnce(form.safe.threshold, form.owners.length)}
            </Typography>
            <Button size="lg" className="w-full" disabled={!isLast || !form.isValid} onClick={next}>
              {COPY.submit}
            </Button>
          </div>
        )}
      </DrawerFooter>
    </Drawer>
  )
}
