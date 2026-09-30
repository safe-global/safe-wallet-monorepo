/**
 * Seeds local (browser-stored) address-book contacts.
 *
 * Runs via `addInitScript`, i.e. before page scripts on every navigation. Local contacts have no
 * API — they are browser state by definition — so localStorage is the documented setup path.
 *
 * Merges into whatever is already stored, so a test can seed several chains with one call per chain.
 */
import type { Page } from '@playwright/test'
import { CHAIN_IDS, LS_NAMESPACE } from '../data/constants'

export type LocalContact = { readonly name: string; readonly address: string }

export async function seedLocalAddressBook(
  page: Page,
  contacts: readonly LocalContact[],
  chainId: string = CHAIN_IDS.sepolia,
): Promise<void> {
  await page.addInitScript(
    ({ ns, chain, book }) => {
      const key = `${ns}addressBook`
      let stored: Record<string, Record<string, string>> = {}
      try {
        stored = JSON.parse(window.localStorage.getItem(key) ?? '{}')
      } catch {
        stored = {}
      }
      window.localStorage.setItem(key, JSON.stringify({ ...stored, [chain]: { ...stored[chain], ...book } }))
    },
    {
      ns: LS_NAMESPACE,
      chain: chainId,
      book: Object.fromEntries(contacts.map((contact) => [contact.address, contact.name])),
    },
  )
}
