import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { validateAddress } from '@/utils/validation'
import pickBy from 'lodash/pickBy'
import type { RootState } from '.'
import { NounSeed } from '@nouns/assets/dist/types'

export type Contacts = {
  [address: string]: {
    name: string
    superChainAccount?: { id: string; nounSeed: NounSeed }
  }
}

export type ContactsState = { [chainId: string]: Contacts }

const initialState: ContactsState = {}

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    migrate: (state, action: PayloadAction<ContactsState>): ContactsState => {
      // Don't migrate if there's data already
      if (Object.keys(state).length > 0) return state
      // Otherwise, migrate
      return action.payload
    },

    setContacts: (_, action: PayloadAction<ContactsState>): ContactsState => {
      return action.payload
    },

    upsertContact: (
      state,
      action: PayloadAction<{
        chainId: string
        address: string
        name: string
        superChainAccount?: { id: string; nounSeed: NounSeed }
      }>,
    ) => {
      const { chainId, address, name, superChainAccount } = action.payload
      if (name.trim() === '') {
        return
      }
      if (!state[chainId]) state[chainId] = {}
      state[chainId][address] = { name, superChainAccount }
    },

    removeContact: (state, action: PayloadAction<{ chainId: string; address: string }>) => {
      const { chainId, address } = action.payload
      if (!state[chainId]) return state
      delete state[chainId][address]
      if (Object.keys(state[chainId]).length > 0) return state
      delete state[chainId]
    },
  },
})

export const { removeContact, setContacts, upsertContact } = contactsSlice.actions

export const selectAllContacts = (state: RootState): ContactsState => {
  return state[contactsSlice.name]
}

export const selectContactsByChain = createSelector(
  [selectAllContacts, (_, chainId: string) => chainId],
  (allContacts, chainId): Contacts => {
    const chainAddresses = allContacts[chainId] || {}
    const validAddresses = pickBy(chainAddresses, (_, key) => validateAddress(key) === undefined)
    return validAddresses
  },
)
