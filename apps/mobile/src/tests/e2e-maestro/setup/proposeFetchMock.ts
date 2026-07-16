/**
 * E2E fetch interceptor for CGW's propose-transaction endpoint. Installed once
 * from TestCtrls.e2e.tsx (so it never reaches production bundles) and driven by
 * `walletKitE2eState.proposeBehavior`:
 *  - 'live'    → passthrough (default; reset() restores it between flows)
 *  - 'fail500' → synthetic 500 for /propose only
 *
 * Intercepting at the fetch layer (not the RTK endpoint) keeps the real
 * `transactionsProposeTransactionV1` matchers firing, which the walletKit
 * listeners depend on for proposing/abandon bookkeeping.
 *
 * Contract: install-once per JS runtime. The wrapper binds the underlying fetch
 * at install time and the `installed` guard makes later calls no-ops — so a test
 * (or anything else) that swaps global.fetch AFTER installation silently unhooks
 * the interceptor. Bind your mock fetch first, then install (see the test).
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
