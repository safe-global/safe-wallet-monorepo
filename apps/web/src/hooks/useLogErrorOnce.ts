import { useEffect, useRef } from 'react'
import type ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import type { ErrorContext } from '@/services/observability/types'

/**
 * Logs a failure once per distinct failure, rather than once per failed attempt.
 *
 * The errors these loaders expose are rebuilt on every attempt — RTK Query
 * writes a fresh error object into store state on each rejection, and `useAsync`
 * constructs a new `Error` per run — so an effect keyed on the error's identity
 * re-fires on every poll even when nothing about the failure changed. Keying on
 * what is actually reported instead means a Safe that keeps failing a 15s poll
 * logs once, while a failure whose message or context changes, and one that
 * returns after recovering, both still log.
 *
 * Pass `undefined` for `message` whenever there is nothing to report (no error,
 * or a call site that is deliberately suppressing one); that also re-arms the
 * hook, so the next failure is reported.
 */
const useLogErrorOnce = (code: ErrorCodes, message?: string, context?: ErrorContext): void => {
  const signature = message === undefined ? undefined : `${code}|${message}|${JSON.stringify(context ?? {})}`

  // Read through a ref so the effect can depend on the signature alone: the
  // context object is rebuilt by some callers on every render, and depending on
  // it directly would reintroduce exactly the re-firing this hook exists to stop.
  const latest = useRef({ code, message, context })
  latest.current = { code, message, context }

  const lastLogged = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (signature === undefined) {
      lastLogged.current = undefined
      return
    }

    if (lastLogged.current === signature) return
    lastLogged.current = signature

    logError(latest.current.code, latest.current.message, latest.current.context)
  }, [signature])
}

export default useLogErrorOnce
