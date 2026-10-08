import type { ReactElement, ReactNode } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ShareIcon from '@/public/images/common/share.svg'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { cn } from '@/utils/cn'

const actionButtonClassName = 'shrink-0 bg-background text-foreground hover:bg-muted'

export type SafeAppActionButtonsViewProps = {
  safeApp: SafeAppData
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
  renderCopyButton: (props: { initialToolTipText: string; children: ReactNode }) => ReactNode
}

export function SafeAppActionButtonsView({
  safeApp,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
  renderCopyButton,
}: SafeAppActionButtonsViewProps): ReactElement {
  return (
    <div className="flex items-center gap-2">
      {openPreviewDrawer && (
        <Button
          variant="ghost"
          size="icon-sm"
          className={actionButtonClassName}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            openPreviewDrawer(safeApp)
          }}
        >
          <InfoIcon className="size-4 text-[var(--color-border-main)]" />
        </Button>
      )}

      {renderCopyButton({
        initialToolTipText: `Copy share URL for ${safeApp.name}`,
        children: (
          <Button data-testid="copy-btn-icon" variant="ghost" size="icon-sm" className={actionButtonClassName}>
            <ShareIcon className="size-4 text-[var(--color-border-main)]" />
          </Button>
        ),
      })}

      {onBookmarkSafeApp && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${isBookmarked ? 'Unpin' : 'Pin'} ${safeApp.name}`}
                // eslint-disable-next-line no-restricted-syntax -- active/pinned state indicator
                className={cn(actionButtonClassName, isBookmarked && 'bg-muted hover:bg-muted/80')}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onBookmarkSafeApp(safeApp.id)
                }}
              >
                {isBookmarked ? (
                  <BookmarkedIcon className="size-4 fill-current text-foreground" />
                ) : (
                  <BookmarkIcon className="size-4 text-[var(--color-border-main)]" />
                )}
              </Button>
            }
          />
          <TooltipContent>{`${isBookmarked ? 'Unpin' : 'Pin'} ${safeApp.name}`}</TooltipContent>
        </Tooltip>
      )}

      {removeCustomApp && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${safeApp.name}`}
                className={actionButtonClassName}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  removeCustomApp(safeApp)
                }}
              >
                <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
              </Button>
            }
          />
          <TooltipContent>{`Delete ${safeApp.name}`}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
