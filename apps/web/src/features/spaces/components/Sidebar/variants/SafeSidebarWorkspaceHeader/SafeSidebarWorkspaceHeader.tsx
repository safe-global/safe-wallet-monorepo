import type { ReactElement } from 'react'
import type { SafeWorkspaceHeaderProps } from '@views/features/spaces/components/Sidebar/types'
import { SpaceSelectorDropdown } from '../SpaceSelectorDropdown'
import { BackToSpaceButton } from '../../BackToSpaceButton'
import { AddToSpacePopupModal } from '../../../AddToSpacePopupModal/AddToSpacePopupModal'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { SafeSidebarWorkspaceHeaderView } from '@views/features/spaces/components/Sidebar/variants/SafeSidebarWorkspaceHeader/SafeSidebarWorkspaceHeaderView'

const ADD_TO_WORKSPACE_TRIGGER = 'addToWorkspace'

export interface SafeSidebarWorkspaceHeaderProps {
  workspaceHeader: SafeWorkspaceHeaderProps
}

export const SafeSidebarWorkspaceHeader = ({
  workspaceHeader,
}: SafeSidebarWorkspaceHeaderProps): ReactElement | null => {
  const spaceId = useCurrentSpaceId()

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
        return (
          <SpaceSelectorDropdown
            triggerVariant={ADD_TO_WORKSPACE_TRIGGER}
            selectedSpace={workspaceHeader.selectedSpace}
            spaces={workspaceHeader.spaces}
          />
        )
      }

      return <SafeSidebarWorkspaceHeaderView onOpen={handleAddSafeClick} modal={<AddToSpacePopupModal />} />
    }

    default: {
      const _exhaustive: never = workspaceHeader
      return _exhaustive
    }
  }
}
