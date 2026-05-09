import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { validateAddress } from '@safe-global/utils/utils/validation'
import pickBy from 'lodash/pickBy'
import type { RootState } from '.'

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

    upsertAddressBookEntries: (state, action: PayloadAction<{ chainIds: string[]; address: string; name: string }>) => {
      const { chainIds, address, name } = action.payload
      if (name.trim() === '') {
        return
      }
      chainIds.forEach((chainId) => {
        if (!state[chainId]) state[chainId] = {}
        state[chainId][address] = name
      })
    },

    removeAddressBookEntry: (state, action: PayloadAction<{ chainId: string; address: string }>) => {
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
