import { useState, type ReactElement, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '@safe-global/views/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'

export type ExpandableCardProps = {
  summary: ReactNode
  /** Names the details for screen readers, e.g. "recipient details". */
  detailsLabel: string
  children: ReactNode
  defaultOpen?: boolean
}

const ExpandableCard = ({
  summary,
  detailsLabel,
  children,
  defaultOpen = false,
}: ExpandableCardProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const Chevron = isOpen ? ChevronDown : ChevronRight

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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

export default ExpandableCard
