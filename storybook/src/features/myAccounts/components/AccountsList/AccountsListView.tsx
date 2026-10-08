import type { ReactNode } from 'react'
import MigrationPrompt from '@views/features/myAccounts/components/MigrationPrompt'
import { Typography } from '@/components/ui/typography'

export type AccountsListViewProps = {
  showMigrationPrompt: boolean
  onMigrationProceed: () => void
  showEmptyState: boolean
  currentSafe: ReactNode
  pinnedSafes: ReactNode
  trustedSafesModal: ReactNode
}

export const AccountsListView = ({
  showMigrationPrompt,
  onMigrationProceed,
  showEmptyState,
  currentSafe,
  pinnedSafes,
  trustedSafesModal,
}: AccountsListViewProps) => {
  return (
    <>
      {/* Security check prompt for users with safes but none pinned */}
      {showMigrationPrompt && <MigrationPrompt onProceed={onMigrationProceed} />}

      {currentSafe}
      {pinnedSafes}

      {showEmptyState && (
        <Typography
          data-testid="empty-safe-list"
          color="muted"
          variant="paragraph-small"
          align="center"
          className="py-6"
        >
          You don&apos;t have any safes yet
        </Typography>
      )}

      {trustedSafesModal}
    </>
  )
}
