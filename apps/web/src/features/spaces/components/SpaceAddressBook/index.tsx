import { useMemo, useState } from 'react'
import {
  useIsInvited,
  useIsAdmin,
  useAddressBookSearch,
  useGetSpaceAddressBook,
  useGetAddressBookRequests,
} from '@/features/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { AddressBookEntry } from './SpaceAddressBookTable'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import AddContact from './AddContact'
import AddLocalContact from './AddLocalContact'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import PendingRequestsTable from './PendingRequestsTable'
import ImportAddressBook from './Import'
import RequestToAddButton from './RequestToAddButton'
import AddToWorkspaceButton from './AddToWorkspaceButton'
import { SpaceAddressBookView } from '@views/features/spaces/components/SpaceAddressBook/SpaceAddressBookView'

const SpaceAddressBook = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('workspace')
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const isPrivateAddressBookEnabled = useHasFeature(FEATURES.PRIVATE_ADDRESS_BOOK) ?? false
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const addressBookItems = useGetSpaceAddressBook()
  const pendingRequests = useGetAddressBookRequests()
  const allLocalAddressBooks = useAllAddressBooks()

  const localContacts: AddressBookEntry[] = useMemo(() => {
    const walletAddress = user?.wallets[0]?.address ?? ''
    const byAddress = new Map<string, { address: string; name: string; chainIds: Set<string> }>()
    for (const [chainId, book] of Object.entries(allLocalAddressBooks)) {
      for (const [address, name] of Object.entries(book)) {
        const key = address.toLowerCase()
        const existing = byAddress.get(key)
        if (existing) {
          existing.chainIds.add(chainId)
        } else {
          byAddress.set(key, { address, name, chainIds: new Set([chainId]) })
        }
      }
    }
    return Array.from(byAddress.values()).map(({ address, name, chainIds }) => ({
      name,
      address,
      chainIds: Array.from(chainIds),
      createdBy: walletAddress,
      createdByUserId: 0,
      lastUpdatedBy: '',
      lastUpdatedByUserId: 0,
      createdAt: '',
      updatedAt: '',
      isLocal: true,
    }))
  }, [allLocalAddressBooks, user?.wallets])

  // Local contacts = the local address book (no space contacts)
  // Contacts that duplicate a space address are marked and sorted to the bottom
  const sortedLocalContacts: AddressBookEntry[] = useMemo(() => {
    const spaceAddresses = new Set(addressBookItems.map((item) => item.address.toLowerCase()))

    const marked = localContacts.map((entry) => ({
      ...entry,
      isDuplicate: spaceAddresses.has(entry.address.toLowerCase()),
    }))
    return marked.sort((a, b) => Number(a.isDuplicate) - Number(b.isDuplicate))
  }, [localContacts, addressBookItems])

  const filteredAllRaw = useAddressBookSearch(addressBookItems, searchQuery)
  const filteredAll: AddressBookEntry[] = useMemo(
    () => filteredAllRaw.map((item) => ({ ...item, isLocal: false })),
    [filteredAllRaw],
  )
  const filteredMine = useAddressBookSearch(sortedLocalContacts, searchQuery) as AddressBookEntry[]

  const pendingAddresses = useMemo(
    () => new Set(pendingRequests.map((r) => r.address.toLowerCase())),
    [pendingRequests],
  )

  const renderShareAction = (entry: AddressBookEntry, isCompact: boolean) => {
    if (isAdmin) {
      return (
        <AddToWorkspaceButton
          address={entry.address}
          name={entry.name}
          chainIds={entry.chainIds}
          isCompact={isCompact}
        />
      )
    }
    // Invitees can preview the space but cannot propose contacts
    if (isInvited) {
      return null
    }
    return (
      <RequestToAddButton
        address={entry.address}
        name={entry.name}
        chainIds={entry.chainIds}
        alreadyRequested={pendingAddresses.has(entry.address.toLowerCase())}
        isCompact={isCompact}
      />
    )
  }

  return (
    <SpaceAddressBookView
      isAdmin={isAdmin}
      isInvited={isInvited}
      isPrivateAddressBookEnabled={isPrivateAddressBookEnabled}
      activeTab={activeTab}
      onTabChange={(val) => {
        setSearchQuery('')
        setActiveTab(val)
      }}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      workspaceCount={addressBookItems.length}
      localCount={sortedLocalContacts.length}
      pendingCount={pendingRequests.length}
      filteredWorkspaceCount={filteredAll.length}
      filteredLocalCount={filteredMine.length}
      previewInvite={<PreviewInvite />}
      renderAddContact={(label) => <AddContact label={label} />}
      importAddressBook={<ImportAddressBook />}
      addLocalContact={<AddLocalContact />}
      workspaceTable={<SpaceAddressBookTable entries={filteredAll} />}
      renderLocalTable={(renderExtraAction) => (
        <SpaceAddressBookTable entries={filteredMine} showAddedBy={false} renderExtraAction={renderExtraAction} />
      )}
      renderShareAction={renderShareAction}
      pendingTable={<PendingRequestsTable requests={pendingRequests} />}
    />
  )
}

export default SpaceAddressBook
