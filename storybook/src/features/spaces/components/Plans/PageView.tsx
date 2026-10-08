import type { ReactElement, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

const PlansSkeleton = () => (
  <div className="flex flex-col gap-6" data-testid="plans-skeleton">
    <Skeleton className="h-49 w-full rounded-xl" />
    <Skeleton className="h-140 w-full rounded-xl" />
  </div>
)

export type PageViewProps = {
  isDarkMode: boolean
  isSafePro: boolean
  isLoading: boolean
  announcement: ReactNode
  plans: ReactNode
  changePlanFlow?: ReactNode
}

export const PageView = ({
  isDarkMode,
  isSafePro,
  isLoading,
  announcement,
  plans,
  changePlanFlow,
}: PageViewProps): ReactElement => (
  <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
    <Typography variant="h2" className="mb-6 font-bold leading-[1] tracking-tight">
      Plans
    </Typography>

    {!isSafePro ? (
      <Card
        size="none"
        // eslint-disable-next-line no-restricted-syntax -- Figma's 32px corner has no Card `radius` option
        className="w-full rounded-4xl"
      >
        {announcement}
      </Card>
    ) : isLoading ? (
      <PlansSkeleton />
    ) : (
      plans
    )}

    {changePlanFlow}
  </div>
)
