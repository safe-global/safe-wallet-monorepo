import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import TableCard from '@/components/common/TableCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import AddressBookSearchInput from '@/components/common/AddressBookSearchInput'
import Track from '@/components/common/Track'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { AddressBookEntry } from './SpaceAddressBookTableView'

type ExtraActionRenderer = (entry: AddressBookEntry, context: { isCompact: boolean }) => ReactNode

export type SpaceAddressBookViewProps = {
  isAdmin: boolean
  isInvited: boolean
  isPrivateAddressBookEnabled: boolean
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchQueryChange: (searchQuery: string) => void
  workspaceCount: number
  localCount: number
  pendingCount: number
  filteredWorkspaceCount: number
  filteredLocalCount: number
  previewInvite: ReactNode
  renderAddContact: (label: string) => ReactElement
  importAddressBook: ReactNode
  addLocalContact: ReactNode
  workspaceTable: ReactNode
  renderLocalTable: (renderExtraAction: ExtraActionRenderer) => ReactNode
  renderShareAction: (entry: AddressBookEntry, isCompact: boolean) => ReactNode
  pendingTable: ReactNode
}

export function SpaceAddressBookView({
  isAdmin,
  isInvited,
  isPrivateAddressBookEnabled,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  workspaceCount,
  localCount,
  pendingCount,
  filteredWorkspaceCount,
  filteredLocalCount,
  previewInvite,
  renderAddContact,
  importAddressBook,
  addLocalContact,
  workspaceTable,
  renderLocalTable,
  renderShareAction,
  pendingTable,
}: SpaceAddressBookViewProps) {
  return (
    <>
      {isInvited && previewInvite}

      <div>
        <div className="mb-6 flex flex-col gap-6">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Address book
          </Typography>
        </div>

        <Tabs defaultValue="workspace" onValueChange={(val) => onTabChange(val)}>
          <TabsList variant="underline" className="flex-wrap mb-4">
            <TabsTrigger value="workspace" className="cursor-pointer">
              <Tooltip>
                <TooltipTrigger render={<span />}>Workspace contacts ({workspaceCount})</TooltipTrigger>
                <TooltipContent>Shared contacts visible to everyone in this Workspace</TooltipContent>
              </Tooltip>
            </TabsTrigger>
            {isPrivateAddressBookEnabled && (
              <>
                <TabsTrigger value="mine" className="cursor-pointer">
                  <Tooltip>
                    <TooltipTrigger render={<span />}>Local contacts ({localCount})</TooltipTrigger>
                    <TooltipContent>These contacts are in your local browser storage</TooltipContent>
                  </Tooltip>
                </TabsTrigger>
                <TabsTrigger value="pending" className="cursor-pointer">
                  <Tooltip>
                    <TooltipTrigger render={<span />}>Pending ({pendingCount})</TooltipTrigger>
                    <TooltipContent>Contacts you proposed to add to the Workspace</TooltipContent>
                  </Tooltip>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {(activeTab === 'workspace' || activeTab === 'mine') && (
            // mb-4 on top of the Tabs root's own gap-2: 8px alone left the search almost touching
            <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
              {/* Only rendered when it holds an action. An always-present wrapper is still a flex
                  item when empty, so the row's gap-2 pushed the search 8px right of the table card
                  it sits above — three different left edges for viewers without admin rights. */}
              {(isAdmin && activeTab === 'workspace') || (isPrivateAddressBookEnabled && activeTab === 'mine') ? (
                <div className="flex shrink-0 gap-2">
                  {isAdmin && activeTab === 'workspace' && (
                    <>
                      <Track {...SPACE_EVENTS.ADD_ADDRESS}>{renderAddContact('Add shared contact')}</Track>
                      {importAddressBook}
                    </>
                  )}
                  {isPrivateAddressBookEnabled && activeTab === 'mine' && addLocalContact}
                </div>
              ) : null}
              {(activeTab === 'workspace' ? workspaceCount > 0 : localCount > 0) && (
                // `default` (h-9), not `lg`: the Add contact / Import buttons on this row are
                // `size="action"`, which is h-9.
                <AddressBookSearchInput value={searchQuery} onChange={onSearchQueryChange} inputSize="default" />
              )}
            </div>
          )}

          <TableCard>
            <TabsContent value="workspace">
              {searchQuery && filteredWorkspaceCount === 0 ? (
                <p className="text-muted-foreground mb-2 p-4 text-sm">Found 0 results</p>
              ) : workspaceCount === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">No contacts in this Workspace yet.</p>
              ) : (
                workspaceTable
              )}
            </TabsContent>

            {isPrivateAddressBookEnabled && (
              <>
                <TabsContent value="mine">
                  {searchQuery && filteredLocalCount === 0 ? (
                    <p className="text-muted-foreground mb-2 p-4 text-sm">Found 0 results</p>
                  ) : filteredLocalCount === 0 ? (
                    <p className="text-muted-foreground p-4 text-sm">You haven&apos;t added any contacts yet.</p>
                  ) : (
                    renderLocalTable((entry, { isCompact }) => {
                      if (entry.isDuplicate) {
                        return (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="inline-flex" aria-label={isCompact ? 'Already shared' : undefined} />
                              }
                            >
                              {isCompact ? (
                                <Check className="text-muted-foreground size-4" />
                              ) : (
                                <Badge variant="secondary">Already shared</Badge>
                              )}
                            </TooltipTrigger>
                            <TooltipContent>Already saved in your Workspace address book</TooltipContent>
                          </Tooltip>
                        )
                      }
                      return renderShareAction(entry, isCompact)
                    })
                  )}
                </TabsContent>

                <TabsContent value="pending" className="mt-4 sm:mt-0">
                  {pendingTable}
                </TabsContent>
              </>
            )}
          </TableCard>
        </Tabs>
      </div>
    </>
  )
}
