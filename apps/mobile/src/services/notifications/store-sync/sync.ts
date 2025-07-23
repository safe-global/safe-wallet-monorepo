import { selectAllContacts } from '@/src/store/addressBookSlice'
import { selectAllChains } from '@/src/store/chains'
import { STORAGE_IDS } from '@/src/store/constants'
import { extensionStorage } from './const'
import type { AppStore } from '@/src/store'

/**
 * On iOS we need to intercept the push notification payload and
 * modify the title and body withing the ExtensionService. This happens
 * on the native side. We need to sync the data to the extension storage
 * so that the ExtensionService can use it on the native side.
 *
 * On Android we run in a Headless service, we could theoretically init the redux store,
 * but using MMKV directly for the push notifications is easier.
 */
export function syncNotificationExtensionData(store: AppStore) {
  const state = store.getState()
  const contacts = selectAllContacts(state)
  const chains = selectAllChains(state)

  // Store enhanced chain data including native currency info for proper symbol handling
  const chainMap: Record<string, { name: string; symbol: string; decimals: number }> = {}
  chains.forEach((c) => {
    chainMap[c.chainId] = {
      name: c.chainName,
      symbol: c.nativeCurrency?.symbol ?? 'ETH',
      decimals: c.nativeCurrency?.decimals ?? 18,
    }
  })

  const contactMap: Record<string, string> = {}
  contacts.forEach((c) => {
    contactMap[c.value] = c.name
  })

  const data = JSON.stringify({ chains: chainMap, contacts: contactMap })
  extensionStorage.set(STORAGE_IDS.NOTIFICATION_EXTENSION_DATA, data)
}
