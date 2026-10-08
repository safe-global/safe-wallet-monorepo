import { isPairingUri } from '../../services/utils'
import { WalletConnectContext } from '../WalletConnectContext'
import { WCLoadingState } from '../../types'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getClipboard, isClipboardSupported } from '@/utils/clipboard'
import { useCallback, useContext, useEffect, useId, useState } from 'react'
import { WcInputView } from '@views/features/walletconnect/components/WcInput/WcInputView'

const PROPOSAL_TIMEOUT = 30_000

const useTrackErrors = (error?: Error) => {
  const debouncedErrorMessage = useDebounce(error?.message, 1000)

  // Track errors
  useEffect(() => {
    if (debouncedErrorMessage) {
      trackEvent({ ...WALLETCONNECT_EVENTS.SHOW_ERROR, label: debouncedErrorMessage })
    }
  }, [debouncedErrorMessage])
}

const WcInput = ({ uri }: { uri: string }) => {
  const { walletConnect, loading, setLoading, setError } = useContext(WalletConnectContext)
  const [value, setValue] = useState('')
  const [inputError, setInputError] = useState<Error>()
  const inputId = useId()
  useTrackErrors(inputError)

  const onInput = useCallback(
    async (val: string) => {
      if (!walletConnect) return

      setValue(val)

      if (val && !isPairingUri(val)) {
        setInputError(new Error('Invalid pairing code'))
        return
      }

      setInputError(undefined)

      if (!val) return

      setLoading(WCLoadingState.CONNECT)

      try {
        await walletConnect.connect(val)
      } catch (e) {
        setInputError(asError(e))
        setLoading(null)
      }
      setTimeout(() => {
        if (loading && loading !== WCLoadingState.APPROVE) {
          setLoading(null)
          setError(new Error('Connection timed out'))
        }
      }, PROPOSAL_TIMEOUT)
    },
    [loading, setError, setLoading, walletConnect],
  )

  // Insert a pre-filled uri
  useEffect(() => {
    if (uri) {
      onInput(uri)
    }
  }, [onInput, uri])

  const onPaste = useCallback(async () => {
    // Errors are handled by in getClipboard
    const clipboard = await getClipboard()

    if (clipboard && isPairingUri(clipboard)) {
      onInput(clipboard)
    }
  }, [onInput])

  return (
    <WcInputView
      inputId={inputId}
      value={value}
      errorMessage={inputError?.message}
      isClipboardSupported={isClipboardSupported()}
      isDisabled={!!loading}
      isConnecting={loading === WCLoadingState.CONNECT || loading === WCLoadingState.APPROVE}
      onInput={onInput}
      onPaste={onPaste}
    />
  )
}

export default WcInput
