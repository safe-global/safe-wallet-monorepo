/**
 * E2E fetch interceptor for CGW's propose endpoint, driven by
 * `walletKitE2eState.proposeBehavior` ('fail500' → synthetic 500; reset()
 * restores passthrough). Intercepting at the fetch layer keeps the real RTK
 * matchers firing, which the walletKit listeners depend on.
 *
 * Install-once per JS runtime: the wrapper binds the underlying fetch at
 * install time, so anything swapping global.fetch must do so before installing.
 */
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'

const PROPOSE_URL_RE = /\/v1\/chains\/[^/]+\/transactions\/[^/]+\/propose$/

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof URL) {
    return input.href
  }
  return input.url
}

let installed = false

export const installProposeFetchMock = () => {
  if (installed) {
    return
  }
  installed = true

  const realFetch = global.fetch.bind(global)
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (walletKitE2eState.get().proposeBehavior === 'fail500' && PROPOSE_URL_RE.test(requestUrl(input))) {
      return new Response(JSON.stringify({ code: 500, message: 'E2E synthetic propose failure' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return realFetch(input, init)
  }
}
