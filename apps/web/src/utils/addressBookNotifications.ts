// `bookLabel` is "your address book" or "{Workspace name} address book".

export const getContactAddedMessage = (bookLabel: string): string => `Contact added to ${bookLabel}`

export const getContactUpdatedMessage = (bookLabel: string): string => `Contact updated in ${bookLabel}`

export const getContactRemovedMessage = (bookLabel: string): string => `Contact removed from ${bookLabel}`

export const getImportSuccessMessage = ({
  count,
  networkCount,
  bookLabel,
}: {
  count: number
  networkCount: number
  bookLabel: string
}): string => {
  const contactLabel = count === 1 ? 'contact' : 'contacts'
  const base = `${count} ${contactLabel} imported to ${bookLabel}`

  return networkCount > 1
    ? `${base} across ${networkCount} networks. Only contacts on the current network are shown here`
    : base
}

export const PERSONAL_ADDRESS_BOOK_LABEL = 'your address book'

export const WORKSPACE_ADDRESS_BOOK_FALLBACK_LABEL = 'the workspace address book'

export const getWorkspaceAddressBookLabel = (spaceName: string): string => `${spaceName} address book`
