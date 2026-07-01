import { useMemo, useState } from 'react'
import { Typography } from '@/components/ui/typography'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddContact from './AddContact'
import AddLocalContact from './AddLocalContact'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import PendingRequestsTable from './PendingRequestsTable'
import ImportAddressBook from './Import'
import RequestToAddButton from './RequestToAddButton'
import AddToWorkspaceButton from './AddToWorkspaceButton'

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

  // My contacts = the local address book (no space contacts)
  // Contacts that duplicate a space address are marked and sorted to the bottom
  const myContacts: AddressBookEntry[] = useMemo(() => {
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
  const filteredMine = useAddressBookSearch(myContacts, searchQuery) as AddressBookEntry[]

  const pendingAddresses = useMemo(
    () => new Set(pendingRequests.map((r) => r.address.toLowerCase())),
    [pendingRequests],
  )

  return (
    <>
      {isInvited && <PreviewInvite />}

      <div>
        <div className="mb-6 flex flex-col gap-6">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Address book
          </Typography>
        </div>

        <Tabs
          defaultValue="workspace"
          onValueChange={(val) => {
            setSearchQuery('')
            setActiveTab(val)
          }}
        >
          <TabsList variant="line" className="flex-wrap h-auto mb-4 sm:mb-0">
            <TabsTrigger value="workspace" className="cursor-pointer">
              Workspace contacts ({addressBookItems.length})
            </TabsTrigger>
            {isPrivateAddressBookEnabled && (
              <>
                <TabsTrigger value="mine" className="cursor-pointer">
                  My contacts ({myContacts.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="cursor-pointer">
                  Pending ({pendingRequests.length})
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {(activeTab === 'workspace' || activeTab === 'mine') && (
            <div className="mt-6 flex items-center gap-2">
              <div className="flex shrink-0 gap-2">
                {isAdmin && activeTab === 'workspace' && (
                  <>
                    <Track {...SPACE_EVENTS.ADD_ADDRESS}>
                      <AddContact label="Add shared contact" />
                    </Track>
                    <ImportAddressBook />
                  </>
                )}
                {isPrivateAddressBookEnabled && activeTab === 'mine' && <AddLocalContact />}
              </div>
              {(activeTab === 'workspace' ? addressBookItems.length > 0 : myContacts.length > 0) && (
                <div className="relative w-full sm:w-[320px]">
                  <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search for contacts"
                    aria-label="Search contacts by name or address"
                    className="h-10 bg-white pl-8 dark:bg-white/10 hover:ring-1 hover:ring-ring"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="bg-card mt-6 rounded-lg p-4">
            <TabsContent value="workspace">
              {searchQuery && filteredAll.length === 0 ? (
                <p className="text-muted-foreground mb-2 text-sm">Found 0 results</p>
              ) : addressBookItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">No contacts in this workspace yet.</p>
              ) : (
                <SpaceAddressBookTable entries={filteredAll} />
              )}
            </TabsContent>

            {isPrivateAddressBookEnabled && (
              <>
                <TabsContent value="mine">
                  {searchQuery && filteredMine.length === 0 ? (
                    <p className="text-muted-foreground mb-2 text-sm">Found 0 results</p>
                  ) : filteredMine.length === 0 ? (
                    <p className="text-muted-foreground text-sm">You haven&apos;t added any contacts yet.</p>
                  ) : (
                    <SpaceAddressBookTable
                      entries={filteredMine}
                      showAddedBy={false}
                      renderExtraAction={(entry) => {
                        if (entry.isDuplicate) {
                          return <Badge variant="secondary">Already shared</Badge>
                        }
                        if (isAdmin) {
                          return (
                            <AddToWorkspaceButton address={entry.address} name={entry.name} chainIds={entry.chainIds} />
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
                          />
                        )
                      }}
                    />
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-4 sm:mt-0">
                  <PendingRequestsTable requests={pendingRequests} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </>
  )
}

export default SpaceAddressBook
