import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { AppRoutes } from '@/config/routes'
import { SAFE_TOKEN_ADDRESSES, SafeAppsTag } from '@/config/constants'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import { useLazySafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const SafenetStakingButton = () => {
  const query = useSearchParams()
  const chainId = useChainId()
  const router = useRouter()
  const { balances, loading } = useBalances()
  const [triggerSafeApps] = useLazySafeAppsGetSafeAppsV1Query()
  const [navigating, setNavigating] = useState(false)

  const safeTokenAddress = SAFE_TOKEN_ADDRESSES[chainId]
  const safeTokenItem = balances.items.find(
    (item) => item.tokenInfo.address.toLowerCase() === safeTokenAddress?.toLowerCase(),
  )
  const safeBalance = safeTokenItem
    ? formatVisualAmount(safeTokenItem.balance, safeTokenItem.tokenInfo.decimals, 0)
    : '0'

  const handleClick = async () => {
    setNavigating(true)
    try {
      const [apps] = await Promise.all([
        triggerSafeApps({ chainId, clientUrl: window.location.origin }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])
      const safenetApp = apps.data?.find((app) => app.tags.includes(SafeAppsTag.SAFENET))
      if (!safenetApp) return
      router.push(`${AppRoutes.apps.open}?safe=${query?.get('safe')}&appUrl=${encodeURIComponent(safenetApp.url)}`)
    } finally {
      setNavigating(false)
    }
  }

  return (
    <Tooltip>
      <div className="flex items-center rounded-lg bg-muted">
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClick}
              disabled={navigating}
              className="h-10 px-3 cursor-pointer gap-1.5 rounded-lg bg-transparent hover:bg-muted-foreground/10 transition-colors"
              aria-label="Safenet staking"
            />
          }
        >
          {navigating ? <Loader2 className="size-5 animate-spin" /> : <SafeTokenIcon width={20} height={20} />}
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
