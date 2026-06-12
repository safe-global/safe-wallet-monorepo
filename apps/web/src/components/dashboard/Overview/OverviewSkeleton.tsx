import { type ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

const OverviewSkeleton = (): ReactElement => {
  return (
    <section className="overflow-hidden rounded-3xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5">
      <div className="-mb-6 flex justify-end">
        <Skeleton className="h-6 w-[180px]" />
      </div>
      <div>
        <div className="flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <Typography variant="paragraph-bold" className="mb-1">
              Total balance
            </Typography>

            <Skeleton className="h-[53px] w-full" />
          </div>

          <div className="mt-4 flex flex-row flex-wrap items-start gap-2 md:mt-0 md:flex-nowrap md:items-center">
            <div className="flex-1">
              <Skeleton className="h-[42px] w-full min-w-[96px] rounded-lg" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-[42px] w-full min-w-[96px] rounded-lg" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-[42px] w-full min-w-[96px] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default OverviewSkeleton
