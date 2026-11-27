import { useCallback, useContext, useEffect } from 'react'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import useSafeInfo from '@/hooks/useSafeInfo'
import { WalletConnectContext, WalletConnectProvider } from '../WalletConnectContext'
import useWcUri from '../../hooks/useWcUri'
import WcHeaderWidget from '../WcHeaderWidget'
import WcSessionManager from '../WcSessionManager'

const WalletConnectWidget = () => {
  const { walletConnect, error, setError, open, setOpen, sessions, sessionProposal, loading, rejectSession } =
    useContext(WalletConnectContext)
  const [uri, clearUri] = useWcUri()
  const { safeLoaded } = useSafeInfo()

  const onOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  // A pending proposal is rejected on close, so the dApp gets an answer instead of waiting forever
  const onClose = useCallback(() => {
    setOpen(false)
    if (sessionProposal && !loading) {
      rejectSession().catch(setError)
    }
  }, [setOpen, sessionProposal, loading, rejectSession, setError])

  // Open the popup if there is a pairing code in the URL or clipboard
  useEffect(() => {
    if (safeLoaded && uri) {
      onOpen()
    }
  }, [safeLoaded, uri, onOpen])

  // Clear the pairing code when connected
  useEffect(() => {
    return walletConnect?.onSessionPropose(clearUri)
  }, [walletConnect, clearUri])

  return (
    <WcHeaderWidget isError={!!error} isOpen={open} onOpen={onOpen} onClose={onClose} sessions={sessions}>
      <WcSessionManager uri={uri} />
    </WcHeaderWidget>
  )
}

const WalletConnectUi = () => (
  <ObservabilityErrorBoundary>
    <WalletConnectProvider>
      <WalletConnectWidget />
    </WalletConnectProvider>
  </ObservabilityErrorBoundary>
)

export default WalletConnectUi
