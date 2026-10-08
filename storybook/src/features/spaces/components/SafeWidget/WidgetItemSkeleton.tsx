import type { ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

interface WidgetItemSkeletonProps {
  className?: string
}

const WidgetItemSkeleton = ({ className }: WidgetItemSkeletonProps): ReactElement => {
  return (
    <div
      data-slot="widget-item-skeleton"
      className={cn('flex items-center justify-between rounded-xl py-4 pl-4 pr-6', className)}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>

      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
  )
}

export { WidgetItemSkeleton }
export type { WidgetItemSkeletonProps }
