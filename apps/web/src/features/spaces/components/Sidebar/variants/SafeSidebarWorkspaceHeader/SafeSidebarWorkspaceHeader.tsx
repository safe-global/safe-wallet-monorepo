import type { ReactElement } from 'react'
import { CircleFadingPlus } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import css from '../../styles.module.css'
import type { SafeWorkspaceHeaderProps } from '../../types'
import { SpaceSelectorDropdown } from '../SpaceSelectorDropdown'
import { BackToSpaceButton } from '../../BackToSpaceButton'
import { AddToSpacePopupModal } from '../../../AddToSpacePopupModal/AddToSpacePopupModal'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { isUserActiveAdmin } from '@/features/spaces/utils'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'

export interface SafeSidebarWorkspaceHeaderProps {
  workspaceHeader: SafeWorkspaceHeaderProps
}

export const SafeSidebarWorkspaceHeader = ({
  workspaceHeader,
}: SafeSidebarWorkspaceHeaderProps): ReactElement | null => {
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isSignedIn })

  const handleAddSafeClick = () => {
    trackEvent(
      { ...SPACE_EVENTS.WORKSPACE_SAFE_LINK_STARTED, label: spaceId },
      { workspace_id: spaceId, entry_point: 'sidebar' },
    )
  }

  switch (workspaceHeader.variant) {
    case 'backToSpace':
      return <BackToSpaceButton {...workspaceHeader} />

    case 'addToWorkspace': {
      const spaces = workspaceHeader.spaces ?? []
      const hasSpaces = spaces.length > 0
      if (hasSpaces) {
        const isAdminOfAnySpace = spaces.some((space) => isUserActiveAdmin(space.members ?? [], currentUser?.id))
        if (!isAdminOfAnySpace) return null

        return (
          <SpaceSelectorDropdown
            triggerVariant="addToWorkspace"
            selectedSpace={workspaceHeader.selectedSpace}
            spaces={workspaceHeader.spaces}
            onSpaceAdded={workspaceHeader.onSpaceAdded}
          />
        )
      }

      return (
        <Dialog onOpenChange={(open) => open && handleAddSafeClick()}>
          <DialogTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={css.addSafeToWorkspaceTrigger}
                data-testid="add-safe-to-workspace-button"
                aria-label="Add Safe to workspace"
                aria-haspopup="dialog"
              />
            }
          >
            <span className={css.addSafeToWorkspaceRing}>
              <CircleFadingPlus className={css.addSafeToWorkspacePlusIcon} strokeWidth={2.5} />
            </span>
            <span className={css.addSafeToWorkspaceLabel}>Add Safe to workspace</span>
          </DialogTrigger>
          <DialogContent className="max-w-[420px] p-0" showCloseButton={false}>
            <AddToSpacePopupModal />
          </DialogContent>
        </Dialog>
      )
    }

    default: {
      const _exhaustive: never = workspaceHeader
      return _exhaustive
    }
  }
}
