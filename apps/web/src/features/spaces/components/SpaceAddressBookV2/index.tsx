import { useMemo } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@safe-global/views/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useAddressBookRequestsState } from '../../hooks/useGetAddressBookRequests'
import { useCurrentSpaceId } from '../../public/hooks/useCurrentSpaceId'
import { useIsAdmin, useIsInvited } from '../../public/hooks/useSpaceMembers'
import { useSpaceAddressBookState } from '../../public/hooks/useGetSpaceAddressBook'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import useChains, { useHasFeature } from '@/hooks/useChains'
import PreviewInvite from '../InviteBanner/PreviewInvite'
import LocalContacts from './LocalContacts'
import PendingTab from './PendingTab'
import SuggestedTab from './SuggestedTab'
import { useSuggestedContacts } from './useSuggestedContacts'
import WorkspaceContacts from './WorkspaceContacts'
import { toLocalContacts } from './utils'
import { TOUR_TARGETS } from '@safe-global/views/features/spaces/components/WorkspaceTour/tourTargets'

const TabLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <Tooltip>
    <TooltipTrigger render={<span />}>{label}</TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
)

const withCount = (label: string, count: number, isSettled = true) => (isSettled ? `${label} (${count})` : label)

const SpaceAddressBookV2 = () => {
  const spaceId = useCurrentSpaceId()
  const isAdmin = useIsAdmin()
  const isInvited = useIsInvited()
  const isPrivateAddressBookEnabled = useHasFeature(FEATURES.PRIVATE_ADDRESS_BOOK) ?? false
  const workspaceBook = useSpaceAddressBookState()
  const requests = useAddressBookRequestsState()
  const localBooks = useAllAddressBooks()
  const { configs } = useChains()
  const suggested = useSuggestedContacts()

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

        {/* Keyed by Workspace, so open dialogs, selections and search never carry over to another one */}
        <Tabs key={spaceId} defaultValue="workspace">
          {/* Scrolls sideways on phones; pb-1.5 keeps the underline (bottom -5px) inside the scroll box. */}
          <div className="mb-2.5 overflow-x-auto overflow-y-hidden pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList variant="underline">
              <TabsTrigger value="workspace" className="cursor-pointer" data-tour={TOUR_TARGETS.workspaceContactsTab}>
                <TabLabel
                  label={withCount('Workspace contacts', workspaceBook.items.length, isWorkspaceSettled)}
                  tooltip="Shared contacts visible to everyone in this Workspace"
                />
              </TabsTrigger>
              <TabsTrigger value="suggested" className="cursor-pointer">
                <TabLabel
                  label={withCount(
                    'Suggested',
                    suggested.suggestions.length,
                    !suggested.isLoading && !suggested.isError,
                  )}
                  tooltip="Addresses worth adding to the Workspace address book"
                />
              </TabsTrigger>
              {isPrivateAddressBookEnabled && (
                <>
                  <TabsTrigger value="mine" className="cursor-pointer" data-tour={TOUR_TARGETS.localContactsTab}>
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
          </div>

          <TabsContent value="workspace">
            <WorkspaceContacts
              items={workspaceBook.items}
              tags={workspaceBook.tags}
              isLoading={workspaceBook.isLoading}
              isError={workspaceBook.isError}
              onReload={workspaceBook.refetch}
              isAdmin={isAdmin}
              isInvited={isInvited}
            />
          </TabsContent>

          <TabsContent value="suggested">
            <SuggestedTab
              suggestions={suggested.suggestions}
              isLoading={suggested.isLoading}
              isError={suggested.isError}
              onReload={suggested.refetch}
              isAdmin={isAdmin}
              isInvited={isInvited}
              isPrivateAddressBookEnabled={isPrivateAddressBookEnabled}
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
                <PendingTab requests={requests} workspaceBook={workspaceBook} isAdmin={isAdmin} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </>
  )
}

export default SpaceAddressBookV2
