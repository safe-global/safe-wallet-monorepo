import EarnInfo from '../EarnInfo'
import EarnWidget from '../EarnWidget'
import { useRouter } from 'next/router'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { hideEarnInfoStorageKey } from '../../constants'
import { useDefiV1 } from '../../defiV1/context'
import { DefiV1Page } from '../../defiV1/components/DefiV1Page'

const EarnView = () => {
  const [infoHidden = false, setInfoHidden] = useLocalStorage<boolean>(hideEarnInfoStorageKey)
  const router = useRouter()
  const { asset_id } = router.query
  const defiV1 = useDefiV1()

  if (defiV1) return <DefiV1Page config={defiV1} />

  if (infoHidden) return <EarnWidget asset={asset_id ? String(asset_id) : undefined} />

  return <EarnInfo onGetStarted={() => setInfoHidden(true)} />
}

export default EarnView
