import { useCallback, useContext, useEffect } from 'react'
import { WalletConnectContext } from '../WalletConnectContext'
import WcConnectionForm from '../WcConnectionForm'
import WcErrorMessage from '../WcErrorMessage'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { splitError } from '../../services/utils'
import WcChainSwitchModal from '../WcChainSwitchModal'
import { wcChainSwitchStore } from '../../store/wcChainSwitchSlice'
import WcProposalStep from './WcProposalStep'

type WcSessionManagerProps = {
  uri: string
}

const WcSessionManager = ({ uri }: WcSessionManagerProps) => {
  const { sessions, sessionProposal, error, setError, open } = useContext(WalletConnectContext)
  const chainSwitchRequest = wcChainSwitchStore.useStore()

  useEffect(() => {
    if (!open && chainSwitchRequest) {
      chainSwitchRequest.onCancel()
    }
  }, [open, chainSwitchRequest])

  // Reset error
  const onErrorReset = useCallback(() => {
    setError(null)
  }, [setError])

  // Track errors
  useEffect(() => {
    if (error) {
      // The summary of the error
      const label = splitError(error.message || '')[0]
      trackEvent({ ...WALLETCONNECT_EVENTS.SHOW_ERROR, label })
    }
  }, [error])

  // Nothing to show
  if (!open && !chainSwitchRequest) return null

  if (chainSwitchRequest) {
    return (
      <WcChainSwitchModal
        appInfo={chainSwitchRequest.appInfo}
        chain={chainSwitchRequest.chain}
        safes={chainSwitchRequest.safes}
        onSelectSafe={chainSwitchRequest.onSelectSafe}
        onCancel={chainSwitchRequest.onCancel}
      />
    )
  }

  // Error
  if (error) {
    return <WcErrorMessage error={error} onClose={onErrorReset} />
  }

  // Session proposal
  if (sessionProposal) {
    return <WcProposalStep proposal={sessionProposal} />
  }

  // Connection form (initial state)
  return <WcConnectionForm sessions={sessions} uri={uri} />
}

export default WcSessionManager
