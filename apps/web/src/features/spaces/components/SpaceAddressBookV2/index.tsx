import { useMemo } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import TableCard from '@safe-global/views/components/common/TableCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { SpaceLoadError, SpaceLoading } from '@safe-global/views/features/spaces/components/LoadState'
import { useAddressBookRequestsState, useIsAdmin, useIsInvited, useSpaceAddressBookState } from '@/features/spaces'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import useChains, { useHasFeature } from '@/hooks/useChains'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import PendingRequestsTable from '../SpaceAddressBook/PendingRequestsTable'
import LocalContacts from './LocalContacts'
import WorkspaceContacts from './WorkspaceContacts'
import { toLocalContacts } from './utils'

const TabLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <Tooltip>
    <TooltipTrigger render={<span />}>{label}</TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
)

const withCount = (label: string, count: number, isSettled = true) => (isSettled ? `${label} (${count})` : label)

const SpaceAddressBookV2 = () => {
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const isPrivateAddressBookEnabled = useHasFeature(FEATURES.PRIVATE_ADDRESS_BOOK) ?? false
  const workspaceBook = useSpaceAddressBookState()
  const requests = useAddressBookRequestsState()
  const localBooks = useAllAddressBooks()
  const { configs } = useChains()

  const isWorkspaceSettled = !workspaceBook.isLoading && !workspaceBook.isError
  const isRequestsSettled = !requests.isLoading && !requests.isError

  const localContacts = useMemo(
    () => toLocalContacts(localBooks, workspaceBook.items, configs),
    [localBooks, workspaceBook.items, configs],
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

        <Tabs defaultValue="workspace">
          <TabsList variant="underline" className="mb-4 flex-wrap">
            <TabsTrigger value="workspace" className="cursor-pointer">
              <TabLabel
                label={withCount('Workspace contacts', workspaceBook.items.length, isWorkspaceSettled)}
                tooltip="Shared contacts visible to everyone in this Workspace"
              />
            </TabsTrigger>
            {isPrivateAddressBookEnabled && (
              <>
                <TabsTrigger value="mine" className="cursor-pointer">
                  <TabLabel
                    label={withCount('Local contacts', localContacts.length)}
                    tooltip="These contacts are in your local browser storage"
                  />
                </TabsTrigger>
                <TabsTrigger value="pending" className="cursor-pointer">
                  <TabLabel
                    label={withCount('Pending', requests.items.length, isRequestsSettled)}
                    tooltip="Contacts you proposed to add to the Workspace"
                  />
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="workspace">
            <WorkspaceContacts
              items={workspaceBook.items}
              isLoading={workspaceBook.isLoading}
              isError={workspaceBook.isError}
              onReload={workspaceBook.refetch}
              isAdmin={isAdmin}
              isInvited={isInvited}
            />
          </TabsContent>

          {isPrivateAddressBookEnabled && (
            <>
              <TabsContent value="mine">
                <LocalContacts
                  contacts={localContacts}
                  isWorkspaceSettled={isWorkspaceSettled}
                  pendingRequests={requests.items}
                  isRequestsSettled={isRequestsSettled}
                  isAdmin={isAdmin}
                  isInvited={isInvited}
                />
              </TabsContent>

              <TabsContent value="pending">
                <TableCard>
                  {requests.isLoading ? (
                    <SpaceLoading subject="pending requests" testId="pending-requests-loading" />
                  ) : requests.isError ? (
                    <SpaceLoadError onReload={requests.refetch} testId="pending-requests-error" />
                  ) : (
                    <PendingRequestsTable requests={requests.items} />
                  )}
                </TableCard>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </>
  )
}

export default SpaceAddressBookV2
