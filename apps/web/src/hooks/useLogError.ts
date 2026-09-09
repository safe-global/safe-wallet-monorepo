import { useEffect, useRef } from 'react'
import type ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { logError } from '@/services/exceptions'
import type { ErrorContext } from '@/services/observability/types'

/**
 * Signatures currently being reported, and how many mounted hooks are reporting
 * each. One failure with several concurrent owners — a gas estimation read at
 * once by the execute form, the fee preview and the gas-too-high check — is
 * still one failure, so only the first owner reports it. Entries are released on
 * unmount, so this is bounded by what is mounted and needs no expiry.
 */
const owners = new Map<string, number>()

/** Returns whether this owner is the one that should report `signature`. */
const claim = (signature: string): boolean => {
  const held = owners.get(signature) ?? 0
  owners.set(signature, held + 1)
  return held === 0
}

const release = (signature: string): void => {
  const held = owners.get(signature)
  if (held === undefined) return
  if (held <= 1) owners.delete(signature)
  else owners.set(signature, held - 1)
}

/** What `thrown` reduces to for dedupe purposes, without allocating for the common cases. */
const messageOf = (thrown: unknown): string => (typeof thrown === 'string' ? thrown : asError(thrown).message)

/**
 * Logs a failure once per distinct failure, rather than once per failed attempt.
 *
 * The errors these call sites expose are rebuilt on every attempt — RTK Query
 * writes a fresh error object into store state on each rejection, `useAsync`
 * constructs a new `Error` per run, and a `try`/`catch` in render or in a
 * `useMemo` throws anew on every evaluation — so an effect keyed on the error's
 * identity re-fires even when nothing about the failure changed. Keying on what
 * is actually reported instead means a Safe that keeps failing a 15s poll logs
 * once, while a failure whose message or context changes, and one that returns
 * after recovering, both still log.
 *
 * `thrown` takes the caught value itself, not just its message: `CodedException`
 * recovers the HTTP status and the hardware-wallet details from it, and neither
 * survives being flattened to a string. A message string is still accepted for
 * call sites that only ever had one.
 *
 * Concurrent owners of the same failure collapse to one report, so a hook with
 * several consumers does not need one of them nominated as the reporter.
 *
 * Pass `undefined` (or `null`) whenever there is nothing to report — no error,
 * or a call site deliberately suppressing one; that also re-arms the hook, so
 * the next failure is reported.
 */
const useLogError = (code: ErrorCodes, thrown?: unknown, context?: ErrorContext): void => {
  const signature = thrown == null ? undefined : `${code}|${messageOf(thrown)}|${JSON.stringify(context ?? {})}`

  // Read through a ref so the effect can depend on the signature alone: the
  // thrown error and the context object are rebuilt by some callers on every
  // render, and depending on them directly would reintroduce exactly the
  // re-firing this hook exists to stop.
  const latest = useRef({ code, thrown, context })
  latest.current = { code, thrown, context }

  const lastLogged = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (signature === undefined) {
      lastLogged.current = undefined
      return
    }

    const isReporter = claim(signature)

    // The ref keeps this instance idempotent for a signature even as the claim
    // churns around it — StrictMode tears the effect down and re-runs it, which
    // would otherwise release and re-acquire into a second report.
    if (isReporter && lastLogged.current !== signature) {
      lastLogged.current = signature
      logError(latest.current.code, latest.current.thrown, latest.current.context)
    }

    return () => release(signature)
  }, [signature])
}

/** Test-only: clears the cross-owner claims between unit tests. */
export const __resetUseLogErrorForTests = (): void => {
  owners.clear()
}

export default useLogError
