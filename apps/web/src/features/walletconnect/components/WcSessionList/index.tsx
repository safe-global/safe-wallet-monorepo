import { getPeerName } from '../../services/utils'
import { WalletConnectContext } from '../WalletConnectContext'
import { WCLoadingState } from '../../types'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { SessionTypes } from '@walletconnect/types'
import { useCallback, useContext } from 'react'
import {
  WcSessionListItemView,
  WcSessionListView,
} from '@views/features/walletconnect/components/WcSessionList/WcSessionListView'
import WcNoSessions from './WcNoSessions'

type WcSesstionListProps = {
  sessions: SessionTypes.Struct[]
}

const WcSessionListItem = ({ session }: { session: SessionTypes.Struct }) => {
  const { walletConnect, setError, loading, setLoading } = useContext(WalletConnectContext)

  const { safeLoaded } = useSafeInfo()
  const peerName = getPeerName(session.peer)

  const onDisconnect = useCallback(async () => {
    if (!walletConnect) return

    const label = session.peer.metadata.url
    trackEvent({ ...WALLETCONNECT_EVENTS.DISCONNECT_CLICK, label })

    setLoading(WCLoadingState.DISCONNECT)

    try {
      await walletConnect.disconnectSession(session)
    } catch (error) {
      setLoading(null)
      setError(asError(error))
    }

    setLoading(null)
  }, [walletConnect, session, setLoading, setError])

  return (
    <WcSessionListItemView
      peerName={peerName}
      icon={session.peer.metadata.icons[0]}
      safeLoaded={safeLoaded}
      isLoading={!!loading}
      isDisconnecting={loading === WCLoadingState.DISCONNECT}
      onDisconnect={onDisconnect}
    />
  )
}

const WcSessionList = ({ sessions }: WcSesstionListProps) => {
  if (sessions.length === 0) {
    return <WcNoSessions />
  }

  return (
    <WcSessionListView>
      {Object.values(sessions).map((session) => (
        <WcSessionListItem key={session.topic} session={session} />
      ))}
    </WcSessionListView>
  )
}

export default WcSessionList
