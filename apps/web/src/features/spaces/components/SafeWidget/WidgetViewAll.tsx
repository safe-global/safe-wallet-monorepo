import type { ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

interface WidgetViewAllProps {
  /** Optional overflow count (items beyond those shown) rendered as a `+N` pill before the link. */
  count?: number
  onClick?: () => void
  className?: string
}

const WidgetViewAll = ({ count, onClick, className }: WidgetViewAllProps): ReactElement => (
  <div className={cn('flex items-center gap-2', className)}>
    {count !== undefined && count > 0 && (
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-success-subtle px-1.5 text-xs font-semibold text-success-strong">
        +{count}
      </span>
    )}
    {/* eslint-disable no-restricted-syntax -- bespoke muted, tight inline "view all" link styling from dev's #8271 redesign */}
    <Button
      className="gap-1 px-2 mx-[-15px] font-normal text-muted-foreground"
      variant="ghost"
      size="sm"
      onClick={onClick}
      data-testid="widget-view-all"
    >
      View all
      <ChevronRight className="size-4" />
    </Button>
    {/* eslint-enable no-restricted-syntax */}
  </div>
)

export { WidgetViewAll }
export type { WidgetViewAllProps }
