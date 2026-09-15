import Track from '@/components/common/Track'
import { isPairingUri } from '../../services/utils'
import { WalletConnectContext } from '../WalletConnectContext'
import { WCLoadingState } from '../../types'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getClipboard, isClipboardSupported } from '@/utils/clipboard'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { useCallback, useContext, useEffect, useId, useRef, useState } from 'react'

export const PROPOSAL_TIMEOUT = 5_000

const TIMEOUT_ERROR =
  'Connection timed out. If you already used this pairing code, copy a new one from the dApp and try again.'

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

  // The timeout fires long after onInput ran, so it must read current loading, not the closure's
  const loadingRef = useRef(loading)
  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

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
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (loadingRef.current && loadingRef.current !== WCLoadingState.APPROVE) {
          setLoading(null)
          setError(new Error(TIMEOUT_ERROR))
        }
      }, PROPOSAL_TIMEOUT)
    },
    [setError, setLoading, walletConnect],
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

  const label = inputError ? inputError.message : 'Pairing code'

  return (
    <div className="flex w-full flex-col gap-1.5 text-left">
      <Label htmlFor={inputId} className={inputError ? 'text-destructive' : undefined}>
        {label}
      </Label>

      {isClipboardSupported() ? (
        <Input
          id={inputId}
          data-testid="wc-input"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          autoComplete="off"
          autoFocus
          disabled={!!loading}
          aria-invalid={!!inputError}
          placeholder="wc:"
          spellCheck={false}
        />
      ) : (
        <InputGroup>
          <InputGroupInput
            id={inputId}
            data-testid="wc-input"
            value={value}
            onChange={(e) => onInput(e.target.value)}
            autoComplete="off"
            autoFocus
            disabled={!!loading}
            aria-invalid={!!inputError}
            placeholder="wc:"
            spellCheck={false}
          />
          <InputGroupAddon align="inline-end" className="pr-0">
            <Track {...WALLETCONNECT_EVENTS.PASTE_CLICK}>
              <Button variant="default" size="sm" onClick={onPaste} disabled={!!loading}>
                {loading === WCLoadingState.CONNECT || loading === WCLoadingState.APPROVE ? (
                  <Spinner className="size-5" />
                ) : (
                  'Paste'
                )}
              </Button>
            </Track>
          </InputGroupAddon>
        </InputGroup>
      )}
    </div>
  )
}

export default WcInput
