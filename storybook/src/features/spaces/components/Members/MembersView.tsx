import type { ReactNode } from 'react'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import TableCard from '@/components/common/TableCard'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'

export type MembersListVariantSlot = 'active' | 'pending'

export type MembersViewProps = {
  previewInvite?: ReactNode
  isAdmin: boolean
  onAddMember: () => void
  activeCount: number
  invitedCount: number
  renderMembersList: (variant: MembersListVariantSlot) => ReactNode
  addMemberModal?: ReactNode
}

export const MembersView = ({
  previewInvite,
  isAdmin,
  onAddMember,
  activeCount,
  invitedCount,
  renderMembersList,
  addMemberModal,
}: MembersViewProps) => {
  return (
    <>
      {previewInvite}

      <div>
        <div className="mb-6 flex flex-col gap-6">
          <Typography variant="h2" className="font-bold leading-[1] tracking-tight">
            Team
          </Typography>
          {isAdmin && (
            <Track {...SPACE_EVENTS.ADD_MEMBER_MODAL} label={SPACE_LABELS.members_page}>
              <ShadcnButton data-testid="add-member-button" size="lg" className="px-4 py-0" onClick={onAddMember}>
                <Plus className="size-4 mr-1 text-green-500" />
                Add member
              </ShadcnButton>
            </Track>
          )}
        </div>

        <Tabs defaultValue="members">
          <TabsList variant="underline" className="flex-wrap mb-4 sm:mb-0">
            <TabsTrigger value="members" className="cursor-pointer" data-testid="members-tab">
              Members ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="pending" className="cursor-pointer" data-testid="pending-members-tab">
              Pending ({invitedCount})
            </TabsTrigger>
          </TabsList>

          <TableCard className="mt-6">
            <TabsContent value="members">{renderMembersList('active')}</TabsContent>

            <TabsContent value="pending">
              {invitedCount === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">No pending members.</p>
              ) : (
                renderMembersList('pending')
              )}
            </TabsContent>
          </TableCard>
        </Tabs>

        {addMemberModal}
      </div>
    </>
  )
}
