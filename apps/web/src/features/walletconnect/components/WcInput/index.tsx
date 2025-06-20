import Track from '@/components/common/Track'
import { WCLoadingState } from '@/features/walletconnect/components/WalletConnectProvider'
import { isPairingUri } from '@/features/walletconnect/services/utils'
import { WalletConnectContext } from '@/features/walletconnect/WalletConnectContext'
import useDebounce from '@/hooks/useDebounce'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getClipboard, isClipboardSupported } from '@/utils/clipboard'
import { Button, CircularProgress, InputAdornment, TextField } from '@mui/material'
import { useCallback, useContext, useEffect, useState } from 'react'

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
  const { walletConnect, isLoading, setIsLoading, setError } = useContext(WalletConnectContext)
  const [value, setValue] = useState('')
  const [inputError, setInputError] = useState<Error>()
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

      setIsLoading(WCLoadingState.CONNECT)

      try {
        await walletConnect.connect(val)
      } catch (e) {
        setInputError(asError(e))
        setIsLoading(undefined)
      }
      setTimeout(() => {
        if (isLoading && isLoading !== WCLoadingState.APPROVE) {
          setIsLoading(undefined)
          setError(new Error('Connection timed out'))
        }
      }, PROPOSAL_TIMEOUT)
    },
    [isLoading, setError, setIsLoading, walletConnect],
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
    <TextField
      data-testid="wc-input"
      value={value}
      onChange={(e) => onInput(e.target.value)}
      fullWidth
      autoComplete="off"
      autoFocus
      disabled={!!isLoading}
      error={!!inputError}
      label={inputError ? inputError.message : 'Pairing code'}
      placeholder="wc:"
      spellCheck={false}
      InputProps={{
        autoComplete: 'off',
        endAdornment: isClipboardSupported() ? undefined : (
          <InputAdornment position="end">
            <Track {...WALLETCONNECT_EVENTS.PASTE_CLICK}>
              <Button variant="contained" onClick={onPaste} sx={{ py: 1 }} disabled={!!isLoading}>
                {isLoading === WCLoadingState.CONNECT || isLoading === WCLoadingState.APPROVE ? (
                  <CircularProgress size={20} />
                ) : (
                  'Paste'
                )}
              </Button>
            </Track>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default WcInput
