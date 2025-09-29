import EarnInfo from '@/features/earn/components/EarnInfo'
import EarnWidget from '@/features/earn/components/EarnWidget'
import { useRouter } from 'next/router'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { hideEarnInfoStorageKey } from '@/features/earn/constants'

const EarnView = () => {
  const [infoHidden = false, setInfoHidden] = useLocalStorage<boolean>(hideEarnInfoStorageKey)
  const router = useRouter()
  const { asset_id } = router.query

  if (infoHidden) return <EarnWidget asset={asset_id ? String(asset_id) : undefined} />

  return <EarnInfo onGetStarted={() => setInfoHidden(true)} />
}

export default EarnView
