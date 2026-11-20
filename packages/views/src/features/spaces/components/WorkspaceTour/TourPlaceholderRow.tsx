import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { cn } from '@safe-global/views/utils/cn'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

export const TOUR_PLACEHOLDER_ROW_HEIGHT = 72

const Bar = ({ className }: { className: string }) => <Skeleton className={cn('animate-none', className)} />

export type TourPlaceholderRowProps = {
  rect: SpotlightRect
}

const TourPlaceholderRow = ({ rect }: TourPlaceholderRowProps) => (
  <div
    data-testid="workspace-tour-placeholder-row"
    aria-hidden
    className="pointer-events-none fixed z-[var(--z-overlay)] flex items-center gap-4 bg-card px-4"
    style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: rect.radius }}
  >
    <Bar className="size-8 shrink-0 rounded-full" />
    <div className="flex flex-1 flex-col gap-2">
      <Bar className="h-3 w-32" />
      <Bar className="h-2.5 w-56" />
    </div>
    <Bar className="h-3 w-16" />
    <Bar className="h-3 w-12" />
    <Bar className="h-3 w-20" />
  </div>
)

export default TourPlaceholderRow
