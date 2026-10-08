import type { ReactElement } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import css from './styles.module.css'

export type SafenetStakingWidgetViewProps = {
  safeBalance: string
  loading: boolean
  isNavigating: boolean
  onClick: () => void
}

export function SafenetStakingWidgetView({
  safeBalance,
  loading,
  isNavigating,
  onClick,
}: SafenetStakingWidgetViewProps): ReactElement {
  return (
    <div className={css.container}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Safenet Staking"
              className={css.tokenButton}
              onClick={onClick}
              disabled={isNavigating}
            />
          }
        >
          {isNavigating ? <Spinner className="size-4" /> : <SafeTokenIcon width={24} height={24} />}
          <Typography as="div" variant="paragraph-small" className="leading-none">
            {loading ? <Skeleton className="h-4 w-4" /> : safeBalance}
          </Typography>
        </TooltipTrigger>
        <TooltipContent>Go to Safenet Staking</TooltipContent>
      </Tooltip>
    </div>
  )
}
