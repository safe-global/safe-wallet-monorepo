import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AggregatedBalanceHeaderSlotProps = {
  otherActions: ReactNode
}

export type AggregatedBalancesViewProps = {
  isDimmed: boolean
  renderHeader: (props: AggregatedBalanceHeaderSlotProps) => ReactNode
  receiveModal?: ReactNode
}

export const AggregatedBalancesView = ({ isDimmed, renderHeader, receiveModal }: AggregatedBalancesViewProps) => {
  return (
    <>
      <div className={isDimmed ? 'opacity-50' : undefined}>
        {renderHeader({
          otherActions: (
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MoreVertical className="size-4 text-foreground" />
              Customize
            </Button>
          ),
        })}
      </div>
      {receiveModal}
    </>
  )
}

export const AggregatedBalanceSkeletonView = () => {
  return (
    <div className="mb-4 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-[30px] w-[200px]" />
      </div>
      <Skeleton className="h-9 w-[400px]" />
    </div>
  )
}
