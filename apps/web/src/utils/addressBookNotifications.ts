// `bookLabel` is "your address book" or "{Workspace name} address book".

export const getContactAddedMessage = (bookLabel: string): string => `Contact added to ${bookLabel}`

export const getContactUpdatedMessage = (bookLabel: string): string => `Contact updated in ${bookLabel}`

export const getContactRemovedMessage = (bookLabel: string): string => `Contact removed from ${bookLabel}`

export const getImportSuccessMessage = ({
  count,
  networkCount,
  bookLabel,
  showsEveryNetwork = false,
}: {
  count: number
  networkCount: number
  bookLabel: string
  /** The book lists contacts of every network, as the Workspace address book does. */
  showsEveryNetwork?: boolean
}): string => {
  const contactLabel = count === 1 ? 'contact' : 'contacts'
  const base = `${count} ${contactLabel} imported to ${bookLabel}`

  if (networkCount <= 1) return base
  const acrossNetworks = `${base} across ${networkCount} networks`
  return showsEveryNetwork ? acrossNetworks : `${acrossNetworks}. Only contacts on the current network are shown here`
}

export const PERSONAL_ADDRESS_BOOK_LABEL = 'your address book'

export const WORKSPACE_ADDRESS_BOOK_FALLBACK_LABEL = 'the Workspace address book'

export const getWorkspaceAddressBookLabel = (spaceName: string): string => `${spaceName} address book`

export const ADMIN_ONLY_RENAME_MESSAGE = 'Only Workspace admins can rename this account'

export const ADMIN_ONLY_EDIT_CONTACT_MESSAGE = 'Only Workspace admins can edit contacts'

export const ADMIN_ONLY_DELETE_CONTACT_MESSAGE = 'Only Workspace admins can delete contacts'
