import type { ReactElement } from 'react'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Chip } from '@/components/ui/chip'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import PendingDelegation from './PendingDelegation'
import DelegationErrorBoundary from './DelegationErrorBoundary'
import { usePendingDelegations } from '../hooks/usePendingDelegations'

function PendingDelegationsList(): ReactElement | null {
  const { pendingDelegations, isLoading, refetch } = usePendingDelegations()

  if (isLoading || pendingDelegations.length === 0) return null

  return (
    <div className="mb-4">
      <DelegationErrorBoundary fallbackMessage="Failed to load pending delegations." onRetry={refetch}>
        <Accordion
          defaultValue={['pending-delegations']}
          className="rounded-md border border-[var(--color-border-light)] bg-[var(--color-background-paper)]"
        >
          <AccordionItem value="pending-delegations" className="border-b-0">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <Typography variant="paragraph-small-bold">Pending confirmations</Typography>
                <Chip className="h-5 px-1 text-[11px] font-bold tracking-[1px] bg-[var(--color-warning-light)] text-[var(--color-text-primary)]">
                  {pendingDelegations.length > 19 ? '19+' : pendingDelegations.length}
                </Chip>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0">
              {pendingDelegations.map((delegation, index) => (
                <div key={delegation.messageHash}>
                  <DelegationErrorBoundary fallbackMessage="Failed to load this delegation.">
                    <PendingDelegation delegation={delegation} onRefetch={refetch} />
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

export default PendingDelegationsList
