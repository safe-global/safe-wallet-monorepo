import type { ReactElement, ReactNode } from 'react'
import { CircleFadingPlus } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import css from '@/features/spaces/components/Sidebar/styles.module.css'

export type SafeSidebarWorkspaceHeaderViewProps = {
  onOpen: () => void
  modal: ReactNode
}

/** "Add Safe to Workspace" trigger for a user without Workspaces, opening the add-to-Workspace popup. */
export const SafeSidebarWorkspaceHeaderView = ({
  onOpen,
  modal,
}: SafeSidebarWorkspaceHeaderViewProps): ReactElement => (
  <Dialog onOpenChange={(open) => open && onOpen()}>
    <DialogTrigger
      render={
        <SidebarMenuButton
          size="lg"
          className={css.addSafeToWorkspaceTrigger}
          data-testid="add-safe-to-workspace-button"
          aria-label="Add Safe to Workspace"
          aria-haspopup="dialog"
        />
      }
    >
      <span className={css.addSafeToWorkspaceRing}>
        <CircleFadingPlus className={css.addSafeToWorkspacePlusIcon} />
      </span>
      <span className={css.addSafeToWorkspaceLabel}>Add Safe to Workspace</span>
    </DialogTrigger>
    <DialogContent
      padding="none"
      // eslint-disable-next-line no-restricted-syntax -- max-w-[420px]: bespoke width, not a size token (needs design to snap)
      className="max-w-[420px]"
      showCloseButton={false}
    >
      {modal}
    </DialogContent>
  </Dialog>
)
