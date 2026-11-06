import type { ReactElement } from 'react'
import FeeInfoBannerView from '@safe-global/views/features/fee-payment/components/FeeInfoBanner'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useChainId from '@/hooks/useChainId'
import { PAY_FROM_SAFE_FEES_BANNER_DISMISSED_KEY } from '../../constants'

const FeeInfoBanner = (): ReactElement | null => {
  const chainId = useChainId()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(`${PAY_FROM_SAFE_FEES_BANNER_DISMISSED_KEY}_${chainId}`)

  if (dismissed) return null

  return <FeeInfoBannerView onDismiss={() => setDismissed(true)} />
}

export default FeeInfoBanner
