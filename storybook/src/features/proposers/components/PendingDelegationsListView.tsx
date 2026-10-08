import type { ReactElement, ReactNode } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Chip } from '@/components/ui/chip'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import DelegationErrorBoundary from '@/features/proposers/components/DelegationErrorBoundary'
import type { PendingDelegation } from '@/features/proposers/types'

export type PendingDelegationsListViewProps = {
  pendingDelegations: PendingDelegation[]
  onRetry: () => void
  renderDelegation: (delegation: PendingDelegation) => ReactNode
}

export function PendingDelegationsListView({
  pendingDelegations,
  onRetry,
  renderDelegation,
}: PendingDelegationsListViewProps): ReactElement {
  return (
    <div className="mb-4">
      <DelegationErrorBoundary fallbackMessage="Failed to load pending delegations." onRetry={onRetry}>
        <Accordion
          defaultValue={['pending-delegations']}
          className="rounded-md border border-[var(--color-border-light)] bg-[var(--color-background-paper)]"
        >
          <AccordionItem value="pending-delegations" className="border-b-0">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <Typography variant="paragraph-small-bold">Pending confirmations</Typography>
                <Chip variant="warning" size="sm" className="font-bold tracking-[1px]">
                  {pendingDelegations.length > 19 ? '19+' : pendingDelegations.length}
                </Chip>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0">
              {pendingDelegations.map((delegation, index) => (
                <div key={delegation.messageHash}>
                  <DelegationErrorBoundary fallbackMessage="Failed to load this delegation.">
                    {renderDelegation(delegation)}
                  </DelegationErrorBoundary>
                  {index < pendingDelegations.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DelegationErrorBoundary>
    </div>
  )
}
