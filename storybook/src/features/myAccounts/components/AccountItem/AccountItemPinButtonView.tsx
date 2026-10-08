import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import BookmarkIcon from '@/public/images/apps/bookmark.svg'
import BookmarkedIcon from '@/public/images/apps/bookmarked.svg'

export type AccountItemPinButtonViewProps = {
  isPinned: boolean
  onClick: (e: MouseEvent) => void
}

export const AccountItemPinButtonView = ({ isPinned, onClick }: AccountItemPinButtonViewProps) => {
  const PinIcon = isPinned ? BookmarkedIcon : BookmarkIcon

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-testid="bookmark-icon"
            variant="ghost"
            size="icon"
            onClick={onClick}
            aria-label={isPinned ? 'Remove from my accounts' : 'Add to my accounts'}
          >
            <PinIcon
              className={cn('size-4', isPinned ? 'fill-current text-primary' : 'text-[var(--color-border-main)]')}
            />
          </Button>
        }
      />
      <TooltipContent>{isPinned ? 'Remove from my accounts' : 'Add to my accounts'}</TooltipContent>
    </Tooltip>
  )
}
