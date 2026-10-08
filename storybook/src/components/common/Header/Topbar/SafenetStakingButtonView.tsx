import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'

export type SafenetStakingButtonViewProps = {
  safeBalance: string
  loading: boolean
  isNavigating: boolean
  onClick: () => void
}

export const SafenetStakingButtonView = ({
  safeBalance,
  loading,
  isNavigating,
  onClick,
}: SafenetStakingButtonViewProps) => {
  return (
    <Tooltip>
      <div className="flex items-center rounded-lg bg-muted">
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="chip"
              onClick={onClick}
              disabled={isNavigating}
              className="m-1"
              aria-label="Safenet staking"
            />
          }
        >
          {isNavigating ? <Loader2 className="size-5 animate-spin" /> : <SafeTokenIcon width={20} height={20} />}
          {loading ? (
            <Skeleton className="h-3 w-6" />
          ) : (
            <span className="text-xs text-muted-foreground font-normal">{safeBalance}</span>
          )}
        </TooltipTrigger>
      </div>
      <TooltipContent>Go to Safenet staking</TooltipContent>
    </Tooltip>
  )
}
