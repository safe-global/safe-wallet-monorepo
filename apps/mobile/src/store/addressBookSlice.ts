import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { RootState } from '.'

export type Contact = Omit<AddressInfo, 'name'> & {
  name: string
}

interface AddressBookState {
  contacts: Record<string, Contact>
  selectedContact: Contact | null
}

const initialState: AddressBookState = {
  contacts: {},
  selectedContact: null,
}

export const addressBookSlice = createSlice({
  name: 'addressBook',
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Contact>) => {
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

    updateContact: (state, action: PayloadAction<Contact>) => {
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

    upsertContact: (state, action: PayloadAction<Contact>) => {
      const contact = action.payload
      state.contacts[contact.value] = contact
    },

    addContacts: (state, action: PayloadAction<Contact[]>) => {
      action.payload.forEach((contact) => {
        state.contacts[contact.value] = contact
      })
    },
  },
})

export const { addContact, removeContact, updateContact, addContacts, upsertContact } = addressBookSlice.actions

export const selectAddressBookState = (state: RootState) => state.addressBook

export const selectAllContacts = createSelector(selectAddressBookState, (addressBook) => {
  if (!addressBook || !addressBook.contacts) {
    return []
  }
  return Object.values(addressBook.contacts)
})

export const selectContactByAddress = (address: string) =>
  createSelector(selectAddressBookState, (addressBook): Contact | null => addressBook.contacts[address] || null)

export default addressBookSlice.reducer
