import type { ReactElement } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useChainId from '@/hooks/useChainId'
import { GTF_FEES_BANNER_DISMISSED_KEY } from '../../constants'
import { FeeInfoBannerView } from '@views/features/gtf/components/FeeInfoBanner/FeeInfoBannerView'

const FeeInfoBanner = (): ReactElement | null => {
  const chainId = useChainId()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(`${GTF_FEES_BANNER_DISMISSED_KEY}_${chainId}`)

  if (dismissed) {
    return null
  }

  return <FeeInfoBannerView onDismiss={() => setDismissed(true)} />
}

export default FeeInfoBanner
