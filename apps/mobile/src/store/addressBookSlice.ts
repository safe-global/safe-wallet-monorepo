import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { RootState } from '.'

interface AddressBookState {
  contacts: Record<string, AddressInfo>
  selectedContact: AddressInfo | null
}

const initialState: AddressBookState = {
  contacts: {},
  selectedContact: null,
}

export const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<AddressInfo>) => {
      const contact = action.payload
      state.contacts[contact.value] = contact
    },

    removeContact: (state, action: PayloadAction<string>) => {
      const addressValue = action.payload
      const { [addressValue]: _, ...remainingContacts } = state.contacts
      state.contacts = remainingContacts

      if (state.selectedContact?.value === addressValue) {
        state.selectedContact = null
      }
    },

    selectContact: (state, action: PayloadAction<string | null>) => {
      const addressValue = action.payload
      state.selectedContact = addressValue ? state.contacts[addressValue] || null : null
    },

    updateContact: (state, action: PayloadAction<AddressInfo>) => {
      const contact = action.payload
      if (state.contacts[contact.value]) {
        state.contacts[contact.value] = {
          ...state.contacts[contact.value],
          ...contact,
        }

        if (state.selectedContact?.value === contact.value) {
          state.selectedContact = state.contacts[contact.value]
        }
      }
    },

    addContacts: (state, action: PayloadAction<AddressInfo[]>) => {
      action.payload.forEach((contact) => {
        state.contacts[contact.value] = contact
      })
    },
  },
})

export const { addContact, removeContact, updateContact, addContacts } = addressBookSlice.actions

export const selectAddressBookState = (state: RootState) => state.addressBook

export const selectAllContacts = createSelector(selectAddressBookState, (addressBook) => {
  if (!addressBook || !addressBook.contacts) {
    return []
  }
  return Object.values(addressBook.contacts)
})

export const selectContactByAddress = (address: string) =>
  createSelector(selectAddressBookState, (addressBook) => addressBook.contacts[address] || null)

export default addressBookSlice.reducer
