import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { validateAddress } from '@safe-global/utils/utils/validation'
import pickBy from 'lodash/pickBy'
import type { RootState, listenerMiddlewareInstance } from '.'
import { showNotification } from './notificationsSlice'
import {
  getContactAddedMessage,
  getContactRemovedMessage,
  getContactUpdatedMessage,
  getImportSuccessMessage,
  PERSONAL_ADDRESS_BOOK_LABEL,
} from '@/utils/addressBookNotifications'

export type AddressBook = { [address: string]: string }

export type AddressBookState = { [chainId: string]: AddressBook }

const initialState: AddressBookState = {}

export const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    migrate: (state, action: PayloadAction<AddressBookState>): AddressBookState => {
      // Don't migrate if there's data already
      if (Object.keys(state).length > 0) return state
      // Otherwise, migrate
      return action.payload
    },

    setAddressBook: (_, action: PayloadAction<AddressBookState>): AddressBookState => {
      return action.payload
    },

    upsertAddressBookEntries: (
      state,
      action: PayloadAction<{
        chainIds: string[]
        address: string
        name: string
        notify?: boolean
        notifyBatchId?: string
      }>,
    ) => {
      const { chainIds, address, name } = action.payload
      if (name.trim() === '') {
        return
      }
      chainIds.forEach((chainId) => {
        if (!state[chainId]) state[chainId] = {}
        state[chainId][address] = name
      })
    },

    removeAddressBookEntry: (state, action: PayloadAction<{ chainId: string; address: string; notify?: boolean }>) => {
      const { chainId, address } = action.payload
      if (!state[chainId]) return state
      delete state[chainId][address]
      if (Object.keys(state[chainId]).length > 0) return state
      delete state[chainId]
    },
  },
})

export const { setAddressBook, upsertAddressBookEntries, removeAddressBookEntry } = addressBookSlice.actions

export const selectAllAddressBooks = (state: RootState): AddressBookState => {
  return state[addressBookSlice.name]
}

export const selectAddressBookByChain = createSelector(
  [selectAllAddressBooks, (_, chainId: string) => chainId],
  (allAddressBooks, chainId): AddressBook => {
    const chainAddresses = allAddressBooks[chainId]
    const validAddresses = pickBy(chainAddresses, (_, key) => validateAddress(key) === undefined)
    return chainId ? validAddresses || {} : {}
  },
)

// Per-import tally, keyed by notifyBatchId: row count + the networks they span.
type ImportBatch = { count: number; chainIds: Set<string> }
const importBatches = new Map<string, ImportBatch>()

const ADDRESS_BOOK_GROUP_KEY = 'address-book'

export const addressBookListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: upsertAddressBookEntries,
    effect: async (action, listenerApi) => {
      const { chainIds, address, name, notify, notifyBatchId } = action.payload

      // Notifications are opt-in: side-effect upserts omit `notify` and stay silent.
      if (!notify || name.trim() === '') {
        return
      }

      if (notifyBatchId) {
        const batch = importBatches.get(notifyBatchId) ?? { count: 0, chainIds: new Set<string>() }
        batch.count += 1
        chainIds.forEach((chainId) => batch.chainIds.add(chainId))
        importBatches.set(notifyBatchId, batch)

        // Debounce: each row restarts the timer, so only the last one emits.
        listenerApi.cancelActiveListeners()
        await listenerApi.delay(300)

        try {
          const { count, chainIds: networks } = importBatches.get(notifyBatchId) ?? batch

          listenerApi.dispatch(
            showNotification({
              variant: 'success',
              groupKey: ADDRESS_BOOK_GROUP_KEY,
              message: getImportSuccessMessage({
                count,
                networkCount: networks.size,
                bookLabel: PERSONAL_ADDRESS_BOOK_LABEL,
              }),
            }),
          )
        } finally {
          importBatches.delete(notifyBatchId)
        }
        return
      }
      const original = listenerApi.getOriginalState()
      const existedSomewhere = chainIds.some((chainId) => original.addressBook[chainId]?.[address] !== undefined)
      const changedSomewhere = chainIds.some((chainId) => original.addressBook[chainId]?.[address] !== name)

      if (!changedSomewhere) {
        return
      }

      listenerApi.dispatch(
        showNotification({
          variant: 'success',
          groupKey: ADDRESS_BOOK_GROUP_KEY,
          message: existedSomewhere
            ? getContactUpdatedMessage(PERSONAL_ADDRESS_BOOK_LABEL)
            : getContactAddedMessage(PERSONAL_ADDRESS_BOOK_LABEL),
        }),
      )
    },
  })

  listenerMiddleware.startListening({
    actionCreator: removeAddressBookEntry,
    effect: (action, listenerApi) => {
      const { chainId, address, notify } = action.payload
      if (!notify) {
        return
      }

      // Only notify if an entry was actually present before the delete.
      const original = listenerApi.getOriginalState()
      if (original.addressBook[chainId]?.[address] === undefined) {
        return
      }

      listenerApi.dispatch(
        showNotification({
          variant: 'success',
          groupKey: ADDRESS_BOOK_GROUP_KEY,
          message: getContactRemovedMessage(PERSONAL_ADDRESS_BOOK_LABEL),
        }),
      )
    },
  })
}
