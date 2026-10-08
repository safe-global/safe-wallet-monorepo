import type { ReactNode } from 'react'
import css from '@/features/myAccounts/styles.module.css'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

export type PinnedSafesViewProps = {
  safesList: ReactNode
  onOpenSelectionModal?: () => void
}

export const PinnedSafesView = ({ safesList, onOpenSelectionModal }: PinnedSafesViewProps) => {
  return (
    <div data-testid="pinned-accounts" className="mb-4">
      <div className={css.listHeader}>
        <BookmarkIcon className="mt-0.5 mr-2 size-5 [stroke-width:2]" />
        <Typography variant="h4" className="mb-4">
          My accounts
        </Typography>
      </div>
      {safesList}
      {onOpenSelectionModal && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="sm" onClick={onOpenSelectionModal} data-testid="add-more-safes-button">
            Manage list
          </Button>
        </div>
      )}
    </div>
  )
}
