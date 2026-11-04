/**
 * Puts a Safe in the user's accounts (the persisted `addedSafes` slice), as for a user who opened it before.
 *
 * Safe Shield trusts such a Safe and does not ask to confirm the risk of an unknown Safe. Runs via
 * `addInitScript`, i.e. before page scripts on every navigation of `page`; a second browser context needs its own call.
 */
import type { Page } from '@playwright/test'
import { CHAIN_IDS, LS_NAMESPACE, NETWORK_PREFIXES } from '../data/constants'

type Network = keyof typeof NETWORK_PREFIXES

/** `safe` is the `sep:0x…` form */
export async function addSafeToAccounts(page: Page, safe: string): Promise<void> {
  const [prefix, address] = safe.split(':')
  const network = (Object.keys(NETWORK_PREFIXES) as Network[]).find((name) => NETWORK_PREFIXES[name] === prefix)
  if (!network || !address) throw new Error(`Expected a Safe as <network prefix>:<address>, got "${safe}"`)

  await page.addInitScript(
    ({ key, chain, safeAddress }) => {
      let stored: Record<string, Record<string, object>> = {}
      try {
        stored = JSON.parse(window.localStorage.getItem(key) ?? '{}')
      } catch {
        stored = {}
      }
      const onChain = stored[chain] ?? {}
      window.localStorage.setItem(
        key,
        JSON.stringify({ ...stored, [chain]: { ...onChain, [safeAddress]: onChain[safeAddress] ?? {} } }),
      )
    },
    { key: `${LS_NAMESPACE}addedSafes`, chain: CHAIN_IDS[network], safeAddress: address },
  )
}
