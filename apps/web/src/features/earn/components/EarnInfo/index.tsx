import useBalances from '@/hooks/useBalances'
import { EligibleEarnTokens, VaultAPYs } from '../../constants'
import useChainId from '@/hooks/useChainId'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import {
  EarnBannerCopyView,
  EarnInfoView,
  EarnPoweredByView,
} from '@views/features/earn/components/EarnInfo/EarnInfoView'

export const EarnPoweredBy = () => {
  const isDarkMode = useDarkMode()

  return <EarnPoweredByView isDarkMode={isDarkMode} />
}

export const EarnBannerCopy = () => {
  const isDarkMode = useDarkMode()

  return <EarnBannerCopyView isDarkMode={isDarkMode} />
}

const EarnInfo = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { balances } = useBalances()
  const chainId = useChainId()
  const router = useRouter()
  const isDarkMode = useDarkMode()

  const eligibleAssets = balances.items.filter((token) => EligibleEarnTokens[chainId].includes(token.tokenInfo.address))

  const onEarnClick = (tokenAddress: string) => {
    onGetStarted()

    trackEvent({ ...EARN_EVENTS.OPEN_EARN_PAGE, label: EARN_LABELS.info_asset })

    router.push({
      pathname: AppRoutes.earn,
      query: {
        ...router.query,
        asset_id: `${chainId}_${tokenAddress}`,
      },
    })
  }

  return (
    <EarnInfoView
      isDarkMode={isDarkMode}
      eligibleAssets={eligibleAssets.map((asset) => ({
        asset,
        vaultApy: VaultAPYs[chainId][asset.tokenInfo.address],
      }))}
      onGetStarted={onGetStarted}
      onEarnClick={onEarnClick}
    />
  )
}

export default EarnInfo
