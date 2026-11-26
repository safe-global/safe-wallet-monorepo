import { createContext, useCallback, useContext, useState, type ReactElement, type ReactNode } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { useHasFeature } from '@/hooks/useChains'
import { useSpaceAddressBookState } from '../../../public/hooks/useGetSpaceAddressBook'
import { useIsAdmin } from '../../../public/hooks/useSpaceMembers'
import AddContact from '../../SpaceAddressBook/AddContact'

type ContactTarget = { address: string; chainId: string }

const AddToAddressBookContext = createContext<((target: ContactTarget) => void) | null>(null)

// Rows are virtualized and refreshed live, so the form lives above them and survives a row unmounting
export const AddToAddressBookProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [target, setTarget] = useState<ContactTarget>()
  const close = useCallback(() => setTarget(undefined), [])
  const isV2Enabled = useHasFeature(FEATURES.WORKSPACES_ADDRESS_BOOK_V2)
  const { tags } = useSpaceAddressBookState()

  return (
    <AddToAddressBookContext.Provider value={setTarget}>
      {children}
      {target && (
        <AddContact
          key={`${target.chainId}:${target.address}`}
          prefill={{ address: target.address, chainIds: [target.chainId] }}
          workspaceTags={isV2Enabled ? tags : undefined}
          onClose={close}
        />
      )}
    </AddToAddressBookContext.Provider>
  )
}

/**
 * Opens the add-contact form for an address the Workspace address book doesn't name on this chain. Undefined when the
 * user isn't an admin, the address book hasn't loaded, or it already names the address, or outside the provider.
 */
export const useAddToAddressBook = (address: string, chainId: string): (() => void) | undefined => {
  const open = useContext(AddToAddressBookContext)
  const isAdmin = useIsAdmin()
  const addressBook = useSpaceAddressBookState()
  const contact = useAddressBookItem(address, chainId)
  const isSettled = !addressBook.isLoading && !addressBook.isError && !addressBook.isUninitialized

  if (!open || !isAdmin || !isSettled || contact) return undefined
  return () => open({ address, chainId })
}
