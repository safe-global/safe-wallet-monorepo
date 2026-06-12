import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import { getPeerName } from '../../services/utils'
import { WalletConnectContext } from '../WalletConnectContext'
import { WCLoadingState } from '../../types'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { List, ListItem } from '@/components/ui/list'
import { cn } from '@/utils/cn'
import type { SessionTypes } from '@walletconnect/types'
import { useCallback, useContext } from 'react'
import css from './styles.module.css'
import WcNoSessions from './WcNoSessions'

type WcSesstionListProps = {
  sessions: SessionTypes.Struct[]
}

const WcSessionListItem = ({ session }: { session: SessionTypes.Struct }) => {
  const { walletConnect, setError, loading, setLoading } = useContext(WalletConnectContext)

  const MAX_NAME_LENGTH = 23
  const { safeLoaded } = useSafeInfo()
  let name = getPeerName(session.peer) || 'Unknown dApp'

  if (name.length > MAX_NAME_LENGTH + 1) {
    name = `${name.slice(0, MAX_NAME_LENGTH)}…`
  }

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
    <ListItem className={`px-4 ${css.sessionListItem}`}>
      {session.peer.metadata.icons[0] && (
        <div className={`flex pr-1 ${css.sessionListAvatar}`}>
          <SafeAppIconCard src={session.peer.metadata.icons[0]} alt="icon" width={20} height={20} />
        </div>
      )}

      <span className={cn('flex-1 truncate text-sm', safeLoaded ? 'text-foreground' : 'text-muted-foreground')}>
        {name}
      </span>

      <div className={css.sessionListSecondaryAction}>
        <Button variant="destructive" onClick={onDisconnect} className={css.button} disabled={!!loading}>
          {loading === WCLoadingState.DISCONNECT ? <Spinner className="size-5" /> : 'Disconnect'}
        </Button>
      </div>
    </ListItem>
  )
}

const WcSessionList = ({ sessions }: WcSesstionListProps) => {
  if (sessions.length === 0) {
    return <WcNoSessions />
  }

  return (
    <List className={css.sessionList}>
      {Object.values(sessions).map((session) => (
        <WcSessionListItem key={session.topic} session={session} />
      ))}
    </List>
  )
}

export default WcSessionList
