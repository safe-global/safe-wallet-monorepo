import {
  getContactAddedMessage,
  getContactRemovedMessage,
  getContactUpdatedMessage,
  getImportSuccessMessage,
  getWorkspaceAddressBookLabel,
  PERSONAL_ADDRESS_BOOK_LABEL,
} from '../addressBookNotifications'

describe('addressBookNotifications', () => {
  it('builds add/update/remove messages for the personal book', () => {
    expect(getContactAddedMessage(PERSONAL_ADDRESS_BOOK_LABEL)).toBe('Contact added to your address book')
    expect(getContactUpdatedMessage(PERSONAL_ADDRESS_BOOK_LABEL)).toBe('Contact updated in your address book')
    expect(getContactRemovedMessage(PERSONAL_ADDRESS_BOOK_LABEL)).toBe('Contact removed from your address book')
  })

  it('builds add/update/remove messages for a named workspace book', () => {
    const label = getWorkspaceAddressBookLabel('Acme')
    expect(label).toBe('Acme address book')
    expect(getContactAddedMessage(label)).toBe('Contact added to Acme address book')
    expect(getContactUpdatedMessage(label)).toBe('Contact updated in Acme address book')
    expect(getContactRemovedMessage(label)).toBe('Contact removed from Acme address book')
  })

  it('pluralizes the import message and appends the multi-network hint', () => {
    expect(getImportSuccessMessage({ count: 1, networkCount: 1, bookLabel: PERSONAL_ADDRESS_BOOK_LABEL })).toBe(
      '1 contact imported to your address book',
    )
    expect(getImportSuccessMessage({ count: 3, networkCount: 1, bookLabel: PERSONAL_ADDRESS_BOOK_LABEL })).toBe(
      '3 contacts imported to your address book',
    )
    expect(
      getImportSuccessMessage({ count: 10, networkCount: 5, bookLabel: getWorkspaceAddressBookLabel('Acme') }),
    ).toBe(
      '10 contacts imported to Acme address book across 5 networks. Only contacts on the current network are shown here',
    )
  })
})
