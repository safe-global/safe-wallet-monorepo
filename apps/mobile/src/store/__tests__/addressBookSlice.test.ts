import {
  addressBookSlice,
  upsertContact,
  removeContact,
  addContact,
  selectContact,
  updateContact,
  addContacts,
} from '../addressBookSlice'
import type { Contact } from '../addressBookSlice'

describe('addressBookSlice', () => {
  it('upserts a contact', () => {
    const contact: Contact = { value: '0x1', name: 'Alice' }
    const state = addressBookSlice.reducer(undefined, upsertContact(contact))

    expect(state.contacts['0x1']).toEqual(contact)
  })

  it('updates an existing contact', () => {
    const initial = {
      contacts: { '0x1': { value: '0x1', name: 'Alice' } },
      selectedContact: null,
    }
    const updated: Contact = { value: '0x1', name: 'Alice B' }
    const state = addressBookSlice.reducer(initial, upsertContact(updated))

    expect(state.contacts['0x1']).toEqual(updated)
  })

  it('removes a contact', () => {
    const initial = {
      contacts: { '0x1': { value: '0x1', name: 'Alice' } },
      selectedContact: null,
    }
    const state = addressBookSlice.reducer(initial, removeContact('0x1'))

    expect(state.contacts['0x1']).toBeUndefined()
  })

  it('clears selectedContact when removed', () => {
    const contact: Contact = { value: '0x1', name: 'Alice' }
    const initial = { contacts: { '0x1': contact }, selectedContact: contact }
    const state = addressBookSlice.reducer(initial, removeContact('0x1'))

    expect(state.selectedContact).toBeNull()
  })

  it('adds a contact', () => {
    const contact: Contact = { value: '0x1', name: 'Alice' }
    const state = addressBookSlice.reducer(undefined, addContact(contact))

    expect(state.contacts['0x1']).toEqual(contact)
  })

  it('adds multiple contacts', () => {
    const contacts: Contact[] = [
      { value: '0x1', name: 'Alice' },
      { value: '0x2', name: 'Bob' },
      { value: '0x3', name: 'Charlie' },
    ]
    const state = addressBookSlice.reducer(undefined, addContacts(contacts))

    expect(state.contacts['0x1']).toEqual(contacts[0])
    expect(state.contacts['0x2']).toEqual(contacts[1])
    expect(state.contacts['0x3']).toEqual(contacts[2])
  })

  it('selects a contact by address', () => {
    const contact: Contact = { value: '0x1', name: 'Alice' }
    const initial = {
      contacts: { '0x1': contact },
      selectedContact: null,
    }
    const state = addressBookSlice.reducer(initial, selectContact('0x1'))

    expect(state.selectedContact).toEqual(contact)
  })

  it('selects null when contact does not exist', () => {
    const initial = {
      contacts: {},
      selectedContact: null,
    }
    const state = addressBookSlice.reducer(initial, selectContact('0x1'))

    expect(state.selectedContact).toBeNull()
  })

  it('deselects contact when selecting null', () => {
    const contact: Contact = { value: '0x1', name: 'Alice' }
    const initial = {
      contacts: { '0x1': contact },
      selectedContact: contact,
    }
    const state = addressBookSlice.reducer(initial, selectContact(null))

    expect(state.selectedContact).toBeNull()
  })

  it('updates an existing contact', () => {
    const original: Contact = { value: '0x1', name: 'Alice' }
    const initial = {
      contacts: { '0x1': original },
      selectedContact: null,
    }
    const updated: Contact = { value: '0x1', name: 'Alice Updated' }
    const state = addressBookSlice.reducer(initial, updateContact(updated))

    expect(state.contacts['0x1']).toEqual({ ...original, ...updated })
  })

  it('updates selectedContact when updating the selected contact', () => {
    const original: Contact = { value: '0x1', name: 'Alice' }
    const initial = {
      contacts: { '0x1': original },
      selectedContact: original,
    }
    const updated: Contact = { value: '0x1', name: 'Alice Updated' }
    const state = addressBookSlice.reducer(initial, updateContact(updated))

    expect(state.selectedContact).toEqual({ ...original, ...updated })
  })

  it('does not update non-existing contact', () => {
    const initial = {
      contacts: {},
      selectedContact: null,
    }
    const contact: Contact = { value: '0x1', name: 'Alice' }
    const state = addressBookSlice.reducer(initial, updateContact(contact))

    expect(state.contacts['0x1']).toBeUndefined()
  })
})
