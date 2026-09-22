import { useCallback, useEffect, useState } from 'react'

const REQUEST_TIMEOUT_MS = 20_000
const REFRESH_RETRY_MS = 30_000
const MAX_REFRESH_RETRY_MS = 5 * 60_000

export type SupportSession = {
  appId: string
  email: string
  jwt: string
  expiresAt: number
  supportEligible: boolean
  identityType?: 'email' | 'wallet'
}

function parseSession(value: unknown): SupportSession {
  if (
    !value ||
    typeof value !== 'object' ||
    !('appId' in value) ||
    typeof value.appId !== 'string' ||
    !('email' in value) ||
    typeof value.email !== 'string' ||
    !('jwt' in value) ||
    typeof value.jwt !== 'string' ||
    !('expiresAt' in value) ||
    typeof value.expiresAt !== 'number' ||
    !Number.isFinite(value.expiresAt) ||
    value.expiresAt <= Date.now() / 1000 ||
    ('identityType' in value && value.identityType !== 'email' && value.identityType !== 'wallet') ||
    !('supportEligible' in value) ||
    typeof value.supportEligible !== 'boolean'
  )
    throw new Error('Invalid support session')
  return {
    appId: value.appId,
    email: value.email,
    jwt: value.jwt,
    expiresAt: value.expiresAt,
    supportEligible: value.supportEligible,
    ...('identityType' in value && (value.identityType === 'email' || value.identityType === 'wallet')
      ? { identityType: value.identityType }
      : {}),
  }
}

export function useSupportSession(
  gatewayUrl: string,
  open: boolean,
  identityKey?: string,
  { autoRefresh = true }: { autoRefresh?: boolean } = {},
) {
  const [session, setSession] = useState<{ identityKey: string; value: SupportSession }>()
  const [error, setError] = useState<string>()
  const [generation, setGeneration] = useState(0)
  const retry = useCallback(() => setGeneration((value) => value + 1), [])

  useEffect(() => {
    setSession(undefined)
    setError(undefined)
    if (!open || !identityKey) return
    let active = true
    let retryDelay = REFRESH_RETRY_MS
    let timer: ReturnType<typeof setTimeout> | undefined
    let requestTimer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController
    const load = async (refresh = false) => {
      controller = new AbortController()
      requestTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      try {
        const response = await fetch(`${gatewayUrl}/v1/support/session`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!active) return
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          setSession(undefined)
          setError(
            response.status === 404
              ? 'Support is unavailable. Please try again later.'
              : 'Please sign in again to access support.',
          )
          return
        }
        if (!response.ok) throw new Error('Support unavailable')
        const next = parseSession(await response.json())
        if (!active) return
        retryDelay = REFRESH_RETRY_MS
        setError(undefined)
        setSession({ identityKey, value: next })
        if (autoRefresh) {
          timer = setTimeout(() => void load(true), Math.max(1000, next.expiresAt * 1000 - Date.now() - 30000))
        }
      } catch {
        if (!active) return
        setError(
          controller.signal.aborted
            ? 'Support did not respond. Please try again.'
            : 'Unable to load support. Please try again.',
        )
        if (refresh && autoRefresh) {
          timer = setTimeout(() => void load(true), retryDelay)
          retryDelay = Math.min(retryDelay * 2, MAX_REFRESH_RETRY_MS)
        }
      } finally {
        clearTimeout(requestTimer)
      }
    }
    void load()
    return () => {
      active = false
      controller.abort()
      clearTimeout(requestTimer)
      if (timer) clearTimeout(timer)
    }
  }, [gatewayUrl, open, identityKey, generation, autoRefresh])

  return {
    session: open && identityKey === session?.identityKey ? session?.value : undefined,
    error,
    retry,
  }
}
