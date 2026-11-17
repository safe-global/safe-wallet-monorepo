import { useState } from 'react'
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
import { DEFI_V1_COPY, formatApy } from '../copy'
import type { Opportunity } from '../types'
import {
  AmountFields,
  BudgetFields,
  ProposedActions,
  ProposedView,
  ScheduleFields,
  StepsSummary,
  useInvestmentForm,
  WhereFields,
  WhoFields,
  type CreatedInvestment,
} from './InvestmentForm'
import { OpportunityMark } from './TreasuryTables'

const COPY = DEFI_V1_COPY.operations

/** One form to set up an investment: fields appear as the choices above them need them. */
export const SetUpInvestmentDialog = ({
  open,
  opportunity,
  options,
  onClose,
  onCreate,
  onView,
}: {
  open: boolean
  opportunity: Opportunity | null
  options: Opportunity[]
  onClose: () => void
  onCreate: (created: CreatedInvestment) => void
  onView: (opportunity: Opportunity) => void
}) => {
  const form = useInvestmentForm(opportunity, options)
  const [proposed, setProposed] = useState(false)
  const { investment } = form

  if (!investment) return null

  const close = () => {
    setProposed(false)
    form.reset()
    onClose()
  }

  const submit = () => {
    const created = form.toCreated()
    if (created) onCreate(created)
    setProposed(true)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent size="sm" data-testid="set-up-investment">
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

        <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto px-4 py-4">
          {proposed ? (
            <ProposedView form={form} />
          ) : (
            <>
              <AmountFields form={form} />
              <WhereFields form={form} />
              <WhoFields form={form} />
              <BudgetFields form={form} />
              <ScheduleFields form={form} />
              <StepsSummary form={form} />
            </>
          )}
        </div>

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
              <Typography variant="paragraph-small" color="muted" align="center">
                {COPY.approveOnce(form.safe.threshold, form.owners.length)}
              </Typography>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" className="flex-1" onClick={close}>
                  {COPY.cancel}
                </Button>
                <Button size="lg" className="flex-1" disabled={!form.isValid} onClick={submit}>
                  {COPY.submit}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
