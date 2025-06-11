import { store } from '@/src/store'
import { selectAllContacts } from '@/src/store/addressBookSlice'
import { selectAllChains } from '@/src/store/chains'
import { STORAGE_IDS } from '@/src/store/constants'
import { MMKV } from 'react-native-mmkv'

const extensionStorage = new MMKV({ id: 'extension' })

/**
 * On iOS we need to intercept the push notification payload and
 * modify the title and body withing the ExtensionService. This happens
 * on the native side. We need to sync the data to the extension storage
 * so that the ExtensionService can use it on the native side.
 */
export function syncNotificationExtensionData() {
  const state = store.getState()
  const contacts = selectAllContacts(state)
  const chains = selectAllChains(state)

  const chainMap: Record<string, string> = {}
  chains.forEach((c) => {
    chainMap[c.chainId] = c.chainName
  })

  const contactMap: Record<string, string> = {}
  contacts.forEach((c) => {
    contactMap[c.value] = c.name
  })

  const data = JSON.stringify({ chains: chainMap, contacts: contactMap })
  extensionStorage.set(STORAGE_IDS.NOTIFICATION_EXTENSION_DATA, data)
}

export function startNotificationExtensionSync() {
  syncNotificationExtensionData()
  store.subscribe(syncNotificationExtensionData)
}
