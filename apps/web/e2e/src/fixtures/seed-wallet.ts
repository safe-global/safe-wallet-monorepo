/**
 * Seeds the storage the app reads on start-up to reconnect the last wallet silently
 * (useOnboard → connectLastWallet), so a test starts connected as the private-key signer without
 * driving the onboard modal. Mirrors `connectSignerViaStorage` in cypress/support/utils/wallet.js.
 *
 * Runs via `addInitScript`, i.e. before page scripts on every navigation. The reconnect is
 * asynchronous — wait for `walletPage.accountCenter` before acting as the connected wallet.
 */
import type { Page } from '@playwright/test'
import { LS_NAMESPACE } from '../data/constants'
import { PRIVATE_KEY_MODULE_LABEL } from '@/services/private-key-module/constants'

/**
 * Like seedConnectedWallet, for one of several keys: on each page load the script reads the cookie `cookie`, which
 * names the key to connect, and connects `keys[initial]` while the cookie is not set. One script, so the order of
 * init scripts, which Playwright does not define, cannot pick the key.
 */
export async function seedSwitchableWallet(
  page: Page,
  { keys, initial, cookie }: { keys: Record<string, string>; initial: string; cookie: string },
): Promise<void> {
  await page.addInitScript(
    ({ ns, label, keys, initial, cookie }) => {
      const chosen = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(`${cookie}=`))
        ?.slice(cookie.length + 1)
      const privateKey = keys[chosen ?? initial]
      window.localStorage.setItem(`${ns}lastWallet`, JSON.stringify(label))
      window.sessionStorage.setItem(`${ns}privateKeyModulePK`, JSON.stringify({ isOpen: false, privateKey }))
    },
    { ns: LS_NAMESPACE, label: PRIVATE_KEY_MODULE_LABEL, keys, initial, cookie },
  )
}

export async function seedConnectedWallet(page: Page, privateKey: string): Promise<void> {
  await page.addInitScript(
    ({ ns, label, key }) => {
      window.localStorage.setItem(`${ns}lastWallet`, JSON.stringify(label))
      window.sessionStorage.setItem(`${ns}privateKeyModulePK`, JSON.stringify({ isOpen: false, privateKey: key }))
    },
    { ns: LS_NAMESPACE, label: PRIVATE_KEY_MODULE_LABEL, key: privateKey },
  )
}
