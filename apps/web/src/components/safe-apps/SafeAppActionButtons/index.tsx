import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useShareSafeAppUrl } from '@/components/safe-apps/hooks/useShareSafeAppUrl'
import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import CopyButton from '@/components/common/CopyButton'
import ShareIcon from '@/public/images/common/share.svg'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import { cn } from '@/utils/cn'

type SafeAppActionButtonsProps = {
  safeApp: SafeAppData
  isBookmarked?: boolean
  onBookmarkSafeApp?: (safeAppId: number) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  openPreviewDrawer?: (safeApp: SafeAppData) => void
}

const actionButtonClassName = 'shrink-0 bg-background text-foreground hover:bg-muted'

const SafeAppActionButtons = ({
  safeApp,
  isBookmarked,
  onBookmarkSafeApp,
  removeCustomApp,
  openPreviewDrawer,
}: SafeAppActionButtonsProps) => {
  const isCustomApp = safeApp.id < 1
  const shareSafeAppUrl = useShareSafeAppUrl(safeApp.url)

  const handleCopyShareSafeAppUrl = () => {
    const appName = isCustomApp ? safeApp.url : safeApp.name
    trackSafeAppEvent(SAFE_APPS_EVENTS.COPY_SHARE_URL, appName)
  }

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

      <CopyButton
        initialToolTipText={`Copy share URL for ${safeApp.name}`}
        onCopy={handleCopyShareSafeAppUrl}
        text={shareSafeAppUrl}
      >
        <Button data-testid="copy-btn-icon" variant="ghost" size="icon-sm" className={actionButtonClassName}>
          <ShareIcon className="size-4 text-[var(--color-border-main)]" />
        </Button>
      </CopyButton>

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

export default SafeAppActionButtons
