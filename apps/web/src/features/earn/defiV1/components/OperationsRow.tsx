import { Lock, Plus, Users } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Progress } from '@safe-global/views/components/ui/progress'
import { Typography } from '@safe-global/views/components/ui/typography'
import { DEFI_V1_COPY, formatCompactUsd } from '../copy'
import type { DefiV1Plan, Operation } from '../types'

const COPY = DEFI_V1_COPY.operations

const OperationCard = ({ operation }: { operation: Operation }) => (
  <div className="flex flex-col gap-2 rounded-xl bg-card px-4 py-3" data-testid={`operation-${operation.id}`}>
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-sm font-medium">{operation.name}</span>
      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <Users className="size-3.5" aria-hidden />
        {COPY.signers(operation.threshold, operation.owners)}
      </span>
    </div>
    <Progress
      value={operation.budget > 0 ? (operation.invested / operation.budget) * 100 : 0}
      aria-label={`${operation.name} budget used`}
      indicatorClassName="bg-badge-dot-success"
    />
    <span className="flex justify-between gap-2 text-xs text-muted-foreground tabular-nums">
      <span>{COPY.investedOf(formatCompactUsd(operation.invested), formatCompactUsd(operation.budget))}</span>
      <span>{COPY.options(operation.opportunityIds.length)}</span>
    </span>
  </div>
)

export const OperationsRow = ({
  operations,
  plan,
  onNew,
}: {
  operations: Operation[]
  plan: DefiV1Plan
  onNew: () => void
}) => (
  <section aria-label={COPY.title} className="flex flex-col gap-2" data-testid="operations-row">
    <div className="flex flex-col">
      <Typography variant="paragraph-small-medium">{COPY.title}</Typography>
      <Typography variant="paragraph-mini" color="muted">
        {COPY.lead}
      </Typography>
    </div>
    {plan === 'pro' ? (
      <div className="grid gap-3 @2xl:grid-cols-3">
        {operations.map((operation) => (
          <OperationCard key={operation.id} operation={operation} />
        ))}
        <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed border-border">
          <Button variant="ghost" onClick={onNew} data-testid="new-operation">
            <Plus />
            {COPY.newOperation}
          </Button>
        </div>
      </div>
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{COPY.teaserTitle}</span>
            <span className="text-xs text-muted-foreground">{COPY.teaserBody}</span>
          </div>
        </div>
        <Button variant="outline" size="sm">
          {COPY.seePro}
        </Button>
      </div>
    )}
  </section>
)
