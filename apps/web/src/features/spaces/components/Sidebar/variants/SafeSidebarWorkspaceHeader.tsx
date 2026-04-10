import type { ReactElement } from 'react'
import { CircleFadingPlus } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import css from '../styles.module.css'
import type { SafeWorkspaceHeaderProps } from '../types'
import { SpaceSelectorDropdown } from './SpaceSelectorDropdown'
import { BackToSpaceButton } from '../BackToSpaceButton'
import { AddToSpacePopupModal } from '../../AddToSpacePopupModal/AddToSpacePopupModal'

export interface SafeSidebarWorkspaceHeaderProps {
  workspaceHeader: SafeWorkspaceHeaderProps
}

export const SafeSidebarWorkspaceHeader = ({ workspaceHeader }: SafeSidebarWorkspaceHeaderProps): ReactElement => {
  switch (workspaceHeader.variant) {
    case 'backToSpace':
      return <BackToSpaceButton {...workspaceHeader} />

    case 'addToWorkspace': {
      const hasSpaces = (workspaceHeader.spaces?.length ?? 0) > 0
      if (hasSpaces) {
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
        <Dialog>
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
          <DialogContent className="max-w-[420px] p-0">
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
