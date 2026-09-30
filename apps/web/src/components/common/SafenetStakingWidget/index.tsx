import { isSafeToken } from '@/utils/safe-token'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import SafeTokenIcon from '@/public/images/common/safe-token.svg'
import css from './styles.module.css'

const SafenetStakingWidget = () => {
  const chainId = useChainId()
  const { balances, loading } = useBalances()
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  const safeTokenItem = balances.items.find((item) => isSafeToken(chainId, item.tokenInfo.address))
  const safeBalance = safeTokenItem
    ? formatVisualAmount(safeTokenItem.balance, safeTokenItem.tokenInfo.decimals, 0)
    : '0'

  return (
    <div className={css.container}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Safenet Staking"
              className={css.tokenButton}
              onClick={openSafenetStakingApp}
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

export default SafenetStakingWidget
