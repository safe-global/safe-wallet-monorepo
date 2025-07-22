import type { Middleware } from '@reduxjs/toolkit'
import { syncNotificationExtensionData } from '@/src/services/notifications/store-sync/sync'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { addressBookSlice } from '@/src/store/addressBookSlice'
import type { AppStore } from '@/src/store'

const notificationSyncMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  if (shouldSyncNotificationData(action)) {
    syncNotificationExtensionData(store as AppStore)
  }

  return result
}

function shouldSyncNotificationData(action: unknown): boolean {
  return (
    // AddressBook slice actions that modify contacts data
    addressBookSlice.actions.addContact.match(action) ||
    addressBookSlice.actions.removeContact.match(action) ||
    addressBookSlice.actions.updateContact.match(action) ||
    addressBookSlice.actions.addContacts.match(action) ||
    addressBookSlice.actions.upsertContact.match(action) ||
    // Chain configuration from RTK Query
    apiSliceWithChainsConfig.endpoints.getChainsConfig.matchFulfilled(action)
  )
}

export default notificationSyncMiddleware
