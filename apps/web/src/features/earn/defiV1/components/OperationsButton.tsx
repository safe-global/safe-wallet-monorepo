import { useState } from 'react'
import { Layers, Lock, Plus, Users } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Progress } from '@safe-global/views/components/ui/progress'
import { DEFI_V1_COPY, formatCompactUsd } from '../copy'
import type { DefiV1Plan, Operation } from '../types'

const COPY = DEFI_V1_COPY.operations

const OperationItem = ({ operation }: { operation: Operation }) => (
  <li className="flex flex-col gap-2 rounded-lg bg-card px-3 py-2.5" data-testid={`operation-${operation.id}`}>
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
    </span>
  </li>
)

/** One toolbar button that opens the list of nested Safes, so the page itself stays calm. */
export const OperationsButton = ({
  operations,
  plan,
  onNew,
}: {
  operations: Operation[]
  plan: DefiV1Plan
  onNew: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const isPro = plan === 'pro'

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} data-testid="operations-button">
        {isPro ? <Layers /> : <Lock />}
        {COPY.title}
        {isPro && operations.length > 0 && <Badge variant="subtle">{operations.length}</Badge>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent size="sm" data-testid="operations-dialog">
          <DialogHeader divided="subtle">
            <DialogTitle>{isPro ? COPY.title : COPY.teaserTitle}</DialogTitle>
            <DialogDescription>{isPro ? COPY.lead : COPY.teaserBody}</DialogDescription>
          </DialogHeader>
          {isPro && (
            <ul className="flex flex-col gap-2 px-4 py-2">
              {operations.map((operation) => (
                <OperationItem key={operation.id} operation={operation} />
              ))}
            </ul>
          )}
          <DialogFooter divided="subtle">
            {isPro ? (
              <Button
                size="lg"
                onClick={() => {
                  setIsOpen(false)
                  onNew()
                }}
                data-testid="new-operation"
              >
                <Plus />
                {COPY.newSafe}
              </Button>
            ) : (
              <Button size="lg">{COPY.seePro}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
