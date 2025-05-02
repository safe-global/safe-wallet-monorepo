import EarnInfo from '@/features/earn/components/EarnInfo'
import EarnWidget from '@/features/earn/components/EarnWidget'
import { useRouter } from 'next/router'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const hideEarnInfoStorageKey = 'hideEarnInfo'

const EarnView = () => {
  const [infoHidden = false, setInfoHidden] = useLocalStorage<boolean>(hideEarnInfoStorageKey)
  const router = useRouter()
  const { asset } = router.query

  if (infoHidden) return <EarnWidget asset={String(asset)} />

  return <EarnInfo onGetStarted={() => setInfoHidden(true)} />
}

export default EarnView
