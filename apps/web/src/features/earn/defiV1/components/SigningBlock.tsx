import { Users } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Progress } from '@safe-global/views/components/ui/progress'
import useSafeInfo from '@/hooks/useSafeInfo'
import { DEFI_V1_COPY, formatCompactUsd } from '../copy'
import { budgetLeft } from '../shelf'
import type { Operation } from '../types'

const COPY = DEFI_V1_COPY.operations

/** Who can act on this investment: its nested Safe and budget, or the main Safe threshold with a way to set one up. */
export const SigningBlock = ({ operation, onSetUp }: { operation?: Operation; onSetUp: () => void }) => {
  const { safe } = useSafeInfo()

  if (!operation) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-card px-3 py-3" data-testid="signing-block">
        <div className="flex items-center justify-between gap-2 text-sm font-medium">
          {COPY.needsSignatures(safe.threshold, safe.owners.length)}
          <Badge variant="subtle">{COPY.thisSafe}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{COPY.needsLead}</span>
          <Button variant="outline" size="xs" onClick={onSetUp}>
            {COPY.newSafe}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card px-3 py-3" data-testid="signing-block">
      <div className="flex items-center justify-between gap-2 text-sm font-medium">
        {COPY.runsIn(operation.name)}
        <Badge variant="success">
          <Users aria-hidden />
          {COPY.signers(operation.threshold, operation.owners)}
        </Badge>
      </div>
      <Progress
        value={operation.budget > 0 ? (operation.invested / operation.budget) * 100 : 0}
        aria-label={`${operation.name} budget used`}
        indicatorClassName="bg-badge-dot-success"
      />
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
        <span>
          {COPY.investedOf(formatCompactUsd(operation.invested), formatCompactUsd(operation.budget))}
          {operation.recurring &&
            ` · ${COPY.recurring(formatCompactUsd(operation.recurring.amount), COPY.frequencies[operation.recurring.frequency])}`}
        </span>
        <Button variant="ghost" size="xs" onClick={onSetUp}>
          {COPY.edit}
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">{COPY.budgetLeft(formatCompactUsd(budgetLeft(operation)))}</span>
    </div>
  )
}
