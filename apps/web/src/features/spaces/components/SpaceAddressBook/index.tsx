import { useMemo, useState } from 'react'
import { Typography } from '@mui/material'
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
import type { AddressBookEntry } from './SpaceAddressBookTable'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
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

const SpaceAddressBook = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('workspace')
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const addressBookItems = useGetSpaceAddressBook()
  const privateContacts = useGetPrivateAddressBook()
  const pendingRequests = useGetAddressBookRequests()
  const allLocalAddressBooks = useAllAddressBooks()

  const mySpaceContacts: AddressBookEntry[] = useMemo(
    () =>
      addressBookItems
        .filter((item) => user?.wallets.some((w) => sameAddress(w.address, item.createdBy)))
        .map((item) => ({ ...item, isLocal: false, isPrivate: false })),
    [addressBookItems, user?.wallets],
  )

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
      lastUpdatedBy: '',
      createdAt: '',
      updatedAt: '',
      isLocal: true,
      isPrivate: false,
    }))
  }, [allLocalAddressBooks, user?.wallets])

  // My contacts = space contacts I created + my private contacts + local contacts (deduped)
  const myContacts: AddressBookEntry[] = useMemo(() => {
    const spaceAndPrivate = [...mySpaceContacts, ...privateEntries]
    const uniqueLocal = localContacts.filter(
      (local) => !spaceAndPrivate.some((existing) => sameAddress(existing.address, local.address)),
    )
    return [...spaceAndPrivate, ...uniqueLocal]
  }, [mySpaceContacts, privateEntries, localContacts])

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

  const hasAnyContacts = addressBookItems.length > 0 || privateContacts.length > 0 || localContacts.length > 0

  return (
    <>
      {isInvited && <PreviewInvite />}

      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        {/* Header row: title + subtitle left, buttons right */}
        <div className="mt-6 mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Typography variant="h1">Address book</Typography>
          </div>

          <div className="flex shrink-0 gap-2">
            {isAdmin ? (
              <>
                <ImportAddressBook />
                <Track {...SPACE_EVENTS.ADD_ADDRESS}>
                  <AddContact />
                </Track>
              </>
            ) : (
              <AddPrivateContact />
            )}
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
            <TabsList variant="line">
              <TabsTrigger value="workspace" className="cursor-pointer">
                Workspace contacts ({addressBookItems.length})
              </TabsTrigger>
              <TabsTrigger value="mine" className="cursor-pointer">
                My contacts ({myContacts.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="cursor-pointer">
                Pending ({pendingRequests.length})
              </TabsTrigger>
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
                      if (isAdmin && entry.isLocal) {
                        return (
                          <AddToWorkspaceButton address={entry.address} name={entry.name} chainIds={entry.chainIds} />
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
