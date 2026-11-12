import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '../../primitives/card/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../primitives/collapsible/collapsible'

interface ExpandableCardProps {
  summary: ReactNode
  /** Names the details for screen readers, e.g. "recipient details" */
  detailsLabel: string
  children: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * ExpandableCard
 *
 * A muted card whose whole surface toggles the details below it. The chevron turns from right to down.
 *
 * @example
 * ```tsx
 * <ExpandableCard summary={<span>Payroll · 3 recipients</span>} detailsLabel="recipient details">
 *   <p>Alice, Bob, Carol</p>
 * </ExpandableCard>
 * ```
 */
function ExpandableCard({
  summary,
  detailsLabel,
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: ExpandableCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isOpen = open ?? uncontrolledOpen
  const Chevron = isOpen ? ChevronDown : ChevronRight

  const handleOpenChange = (next: boolean) => {
    if (open === undefined) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return (
    <Collapsible data-slot="expandable-card" open={isOpen} onOpenChange={handleOpenChange} className={className}>
      <Card variant="muted" size="none" radius="lg">
        <CollapsibleTrigger
          aria-label={`${isOpen ? 'Hide' : 'Show'} ${detailsLabel}`}
          className="group/expandable flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {summary}
          <Chevron
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover/expandable:text-foreground"
            aria-hidden
          />
        </CollapsibleTrigger>
      </Card>

      <CollapsibleContent>
        <div className="flex flex-col gap-1 pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export { ExpandableCard }
export type { ExpandableCardProps }
