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
  <div className={cn('flex items-center', className)}>
    {count !== undefined && count > 0 && (
      <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-primary">
        +{count}
      </span>
    )}
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      // eslint-disable-next-line no-restricted-syntax -- tight inline "view all" link: sits flush with the widget's `+N` pill, so it drops the size's default horizontal padding
      className="gap-1 px-2 font-normal text-primary"
      data-testid="widget-view-all"
    >
      View all
      <ChevronRight className="size-4" />
    </Button>
  </div>
)

export { WidgetViewAll }
export type { WidgetViewAllProps }
