import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { isSafeToken } from '@/utils/safe-token'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'

const SafenetStakingButton = () => {
  const chainId = useChainId()
  const { balances, loading } = useBalances()
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  const safeTokenItem = balances.items.find((item) => isSafeToken(chainId, item.tokenInfo.address))
  const safeBalance = safeTokenItem
    ? formatVisualAmount(safeTokenItem.balance, safeTokenItem.tokenInfo.decimals, 0)
    : '0'

  return (
    <Tooltip>
      <div className="flex items-center rounded-lg bg-muted">
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              onClick={openSafenetStakingApp}
              disabled={isNavigating}
              className="gap-1.5 m-1"
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

export default SafenetStakingButton
