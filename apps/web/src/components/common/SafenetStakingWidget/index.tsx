import { useState } from 'react'
import { AppRoutes } from '@/config/routes'
import { SAFE_TOKEN_ADDRESSES, SafeAppsTag } from '@/config/constants'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import css from './styles.module.css'
import { useLazySafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const SafenetStakingWidget = () => {
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
    <div className={css.container}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Safenet Staking"
              className={css.tokenButton}
              onClick={handleClick}
              disabled={navigating}
            />
          }
        >
          {navigating ? <Spinner className="size-4" /> : <SafeTokenIcon width={24} height={24} />}
          <Typography as="div" variant="paragraph-small" className="leading-none">
            {loading ? <Skeleton className="h-4 w-4" /> : safeBalance}
          </Typography>
        </TooltipTrigger>
        <TooltipContent>Go to Safenet Staking</TooltipContent>
      </Tooltip>
    </div>
  )
}

export default SafenetStakingWidget
