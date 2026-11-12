import type { ComponentProps, ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '../../primitives/card/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../primitives/collapsible/collapsible'

interface ExpandableCardProps extends Omit<ComponentProps<typeof Collapsible>, 'children'> {
  summary: ReactNode
  /** Names the details for screen readers, e.g. "recipient details" */
  detailsLabel: string
  children: ReactNode
}

const chevron = 'size-4 shrink-0 text-muted-foreground transition-colors group-hover/expandable:text-foreground'

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
function ExpandableCard({ summary, detailsLabel, children, ...props }: ExpandableCardProps) {
  return (
    <Collapsible data-slot="expandable-card" {...props}>
      <Card variant="muted" size="none" radius="lg">
        <CollapsibleTrigger
          render={(triggerProps, state) => (
            <button {...triggerProps} aria-label={`${state.open ? 'Hide' : 'Show'} ${detailsLabel}`} />
          )}
          className="group/expandable flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {summary}
          <ChevronRight className={`${chevron} group-data-[panel-open]/expandable:hidden`} aria-hidden />
          <ChevronDown className={`${chevron} hidden group-data-[panel-open]/expandable:block`} aria-hidden />
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
