import { useMemo, useState } from 'react'
import { Typography } from '@/components/ui/typography'
import {
  useIsInvited,
  useIsAdmin,
  useAddressBookSearch,
  useGetSpaceAddressBook,
  useGetPrivateAddressBook,
  useGetAddressBookRequests,
} from '@/features/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { AddressBookEntry } from './SpaceAddressBookTable'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import AddContact from './AddContact'
import AddPrivateContact from './AddPrivateContact'
import EmptyAddressBook from './EmptyAddressBook'
import SpaceAddressBookTable from './SpaceAddressBookTable'
import PendingRequestsTable from './PendingRequestsTable'
import ActivityLog from './ActivityLog'
import ImportAddressBook from './Import'
import RequestToAddButton from './RequestToAddButton'
import AddToWorkspaceButton from './AddToWorkspaceButton'
import RemoveDuplicateButton from './RemoveDuplicateButton'

const SpaceAddressBook = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('workspace')
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const isDarkMode = useDarkMode()
  const isPrivateAddressBookEnabled = useHasFeature(FEATURES.PRIVATE_ADDRESS_BOOK) ?? false
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const addressBookItems = useGetSpaceAddressBook()
  const privateContacts = useGetPrivateAddressBook()
  const pendingRequests = useGetAddressBookRequests()
  const allLocalAddressBooks = useAllAddressBooks()

  const privateEntries: AddressBookEntry[] = useMemo(
    () => privateContacts.map((item) => ({ ...item, isLocal: false, isPrivate: true })),
    [privateContacts],
  )

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
      isPrivate: false,
    }))
  }, [allLocalAddressBooks, user?.wallets])

  // My contacts = private contacts + local contacts (no space contacts)
  // Contacts that duplicate a space address are marked and sorted to the bottom
  const myContacts: AddressBookEntry[] = useMemo(() => {
    const spaceAddresses = new Set(addressBookItems.map((item) => item.address.toLowerCase()))

    const uniqueLocal = localContacts.filter(
      (local) => !privateEntries.some((priv) => sameAddress(priv.address, local.address)),
    )
    const allMine = [...privateEntries, ...uniqueLocal]

    // Mark duplicates and sort them to the bottom
    const marked = allMine.map((entry) => ({
      ...entry,
      isDuplicate: spaceAddresses.has(entry.address.toLowerCase()),
    }))
    return marked.sort((a, b) => Number(a.isDuplicate) - Number(b.isDuplicate))
  }, [privateEntries, localContacts, addressBookItems])

  const filteredAllRaw = useAddressBookSearch(addressBookItems, searchQuery)
  const filteredAll: AddressBookEntry[] = useMemo(
    () => filteredAllRaw.map((item) => ({ ...item, isLocal: false, isPrivate: false })),
    [filteredAllRaw],
  )
  const filteredMine = useAddressBookSearch(myContacts, searchQuery) as AddressBookEntry[]

  const pendingAddresses = useMemo(
    () => new Set(pendingRequests.map((r) => r.address.toLowerCase())),
    [pendingRequests],
  )

  const hasAnyContacts =
    addressBookItems.length > 0 || privateContacts.length > 0 || localContacts.length > 0 || pendingRequests.length > 0

  return (
    <>
      {isInvited && <PreviewInvite />}

      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="mb-6 flex flex-col gap-6">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Address book
          </Typography>

          <div className="flex shrink-0 gap-2">
            {isAdmin && activeTab === 'workspace' && (
              <>
                <ImportAddressBook />
                <Track {...SPACE_EVENTS.ADD_ADDRESS}>
                  <AddContact label="Add shared contact" />
                </Track>
              </>
            )}
            {isPrivateAddressBookEnabled && activeTab === 'mine' && <AddPrivateContact />}
          </div>
        </div>

        {!hasAnyContacts ? (
          <EmptyAddressBook />
        ) : (
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
              <TabsTrigger value="activity" className="cursor-pointer">
                Activity log
              </TabsTrigger>
            </TabsList>

            {/* Search bar below tabs (hidden on activity/pending tabs) */}
            {activeTab !== 'activity' && activeTab !== 'pending' && (
              <div className="relative mt-4 mb-4 w-full sm:max-w-[320px]">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search"
                  aria-label="Search contacts by name or address"
                  className="bg-white pl-8 dark:bg-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <div className="bg-card rounded-lg border p-4">
              <TabsContent value="workspace">
                {searchQuery && filteredAll.length === 0 ? (
                  <p className="text-muted-foreground mb-2 text-sm">Found 0 results</p>
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
                            return (
                              <span className="inline-flex items-center gap-2">
                                <Badge variant="secondary">Already shared</Badge>
                                <RemoveDuplicateButton
                                  address={entry.address}
                                  chainIds={entry.chainIds}
                                  isLocal={entry.isLocal}
                                  isPrivate={entry.isPrivate}
                                />
                              </span>
                            )
                          }
                          if (isAdmin && (entry.isLocal || entry.isPrivate)) {
                            return (
                              <AddToWorkspaceButton
                                address={entry.address}
                                name={entry.name}
                                chainIds={entry.chainIds}
                              />
                            )
                          }
                          if (entry.isPrivate || entry.isLocal) {
                            return (
                              <RequestToAddButton
                                address={entry.address}
                                name={entry.name}
                                chainIds={entry.chainIds}
                                isLocal={entry.isLocal}
                                alreadyRequested={pendingAddresses.has(entry.address.toLowerCase())}
                              />
                            )
                          }
                          return null
                        }}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="pending">
                    <PendingRequestsTable requests={pendingRequests} />
                  </TabsContent>
                </>
              )}

              <TabsContent value="activity">
                <ActivityLog entries={filteredAll} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </>
  )
}

export default SpaceAddressBook
