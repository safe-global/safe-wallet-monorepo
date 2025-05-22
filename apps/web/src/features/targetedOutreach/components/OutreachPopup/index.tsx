import dynamic from 'next/dynamic'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

const LazyOutreachPopup = dynamic(() => import('./OutreachPopup'), {
  ssr: false,
})

function OutreachPopup() {
  const isEnabled = useHasFeature(FEATURES.TARGETED_SURVEY)
  return isEnabled ? <LazyOutreachPopup /> : null
}

export default OutreachPopup
