import { useCallback, useEffect } from 'react'
import type { ReactElement } from 'react'
import type { SessionTypes } from '@walletconnect/types'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import WcHints from '../WcHints'
import WcSessionList from '../WcSessionList'
import WcInput from '../WcInput'
import WcLogoHeader from '../WcLogoHeader'
import useSafeInfo from '@/hooks/useSafeInfo'
import { BRAND_NAME } from '@/config/constants'
import { WcConnectionFormView } from '@views/features/walletconnect/components/WcConnectionForm/WcConnectionFormView'

const WC_HINTS_KEY = 'wcHints'

const WcConnectionForm = ({ sessions, uri }: { sessions: SessionTypes.Struct[]; uri: string }): ReactElement => {
  const [showHints = true, setShowHints] = useLocalStorage<boolean>(WC_HINTS_KEY)
  const { safeLoaded } = useSafeInfo()

  const onToggle = useCallback(() => {
    setShowHints((prev) => !prev)
  }, [setShowHints])

  // Show the hints only once
  useEffect(() => {
    return () => setShowHints(false)
  }, [setShowHints])

  return (
    <WcConnectionFormView
      showHints={showHints}
      onToggleHints={onToggle}
      safeLoaded={safeLoaded}
      brandName={BRAND_NAME}
      logoHeader={<WcLogoHeader />}
      input={<WcInput uri={uri} />}
      sessionList={<WcSessionList sessions={sessions} />}
      hints={<WcHints />}
    />
  )
}

export default WcConnectionForm
