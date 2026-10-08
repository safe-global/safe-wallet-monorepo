import useSafeInfo from '@/hooks/useSafeInfo'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCallback } from 'react'
import { WcNoSessionsView } from '@views/features/walletconnect/components/WcSessionList/WcNoSessionsView'

const LS_KEY = 'native_wc_dapps'

const WcNoSessions = () => {
  const { safeLoaded } = useSafeInfo()
  const [showDapps = true, setShowDapps] = useLocalStorage<boolean>(LS_KEY)

  const onUnload = useCallback(() => {
    setShowDapps(false)
  }, [setShowDapps])

  return <WcNoSessionsView showSampleDapps={showDapps && safeLoaded} onUnload={onUnload} />
}

export default WcNoSessions
