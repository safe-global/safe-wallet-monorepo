import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'

const skeletonTone = 'rounded-none bg-[var(--color-background-skeleton)]'

const SkeletonTxListDateLabel = () => <Skeleton className={cn('mt-5 mb-2 h-4 w-40 rounded-sm', skeletonTone)} />

const SkeletonTxListItem = ({ className }: { className?: string }) => (
  <Skeleton className={cn('h-[54px] w-full rounded-xl', skeletonTone, className)} />
)

const SkeletonTxList = () => {
  return (
    <div className="flex flex-col gap-1.5">
      <SkeletonTxListDateLabel />
      <SkeletonTxListItem />
      <SkeletonTxListItem />
      <SkeletonTxListItem />

      <SkeletonTxListDateLabel />
      <SkeletonTxListItem />
      <SkeletonTxListItem />
    </div>
  )
}

export default SkeletonTxList
