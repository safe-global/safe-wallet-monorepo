import { useId, useState, type ReactElement } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/router'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { getDeterministicColor } from '@/features/spaces'
import { cn } from '@/utils/cn'
import { SPACE_SELECTOR_NAME_MAX_LENGTH } from '../constants'
import css from '../styles.module.css'
import type { SpaceItem } from '../types'
import { truncateSpaceName } from '../utils'

interface SpaceSelectorDropdownProps {
  selectedSpace?: SpaceItem
  spaces?: SpaceItem[]
}

export const SpaceSelectorDropdown = ({ selectedSpace, spaces = [] }: SpaceSelectorDropdownProps): ReactElement => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const spaceName = selectedSpace?.name ?? ''
  const displayName = truncateSpaceName(spaceName, SPACE_SELECTOR_NAME_MAX_LENGTH)
  const initial = spaceName.charAt(0).toUpperCase()
  const selectedSpaceColor = spaceName ? getDeterministicColor(spaceName) : undefined
  const triggerAriaLabel = spaceName ? `Selected space ${spaceName}. Open space selector` : 'Open space selector'

  const handleSelectSpace = (spaceId: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, spaceId: spaceId.toString() },
    })
  }

  const handleCreateSpace = () => {
    trackEvent({ ...SPACE_EVENTS.CREATE_SPACE_MODAL, label: SPACE_LABELS.space_selector })
    router.push(AppRoutes.spaces.createSpace)
  }

  const handleViewSpaces = () => {
    trackEvent({ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.space_selector })
    router.push(AppRoutes.welcome.spaces)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className={css.spaceSelector}
            data-testid="space-selector-button"
            aria-label={triggerAriaLabel}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
          />
        }
      >
        <Avatar className={css.spaceSelectorAvatar}>
          <AvatarFallback
            className={css.spaceSelectorAvatarFallback}
            style={selectedSpaceColor ? { backgroundColor: selectedSpaceColor } : undefined}
          >
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className={css.spaceSelectorText}>
          {spaceName ? (
            <Tooltip>
              <TooltipTrigger render={<span className={css.spaceSelectorName} />}>{displayName}</TooltipTrigger>
              <TooltipContent side="top">{spaceName}</TooltipContent>
            </Tooltip>
          ) : (
            <span className={css.spaceSelectorName} />
          )}
          <span className={css.spaceSelectorSubtitle}>Space</span>
        </div>
        <div className="ml-auto flex flex-col items-center shrink-0 -space-y-1" aria-hidden>
          <ChevronUp className="size-4" />
          <ChevronDown className="size-4" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        id={menuId}
        side="bottom"
        align="start"
        className={css.spaceSelectorDropdownContent}
        data-testid="space-selector-menu"
      >
        {selectedSpace && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className={css.spaceSelectorAvatar}>
              <AvatarFallback
                className={css.spaceSelectorAvatarFallback}
                style={{ backgroundColor: selectedSpaceColor }}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className={css.textSmallBold}>{selectedSpace.name}</div>
              <div className={css.textMini}>Space</div>
            </div>
          </div>
        )}

        <DropdownMenuSeparator />

        {spaces.map((space) => (
          <DropdownMenuItem key={space.id} onClick={() => handleSelectSpace(space.id)}>
            <Avatar className={cn('size-6 shrink-0', css.spaceSelectorItemAvatar)}>
              <AvatarFallback
                className={css.spaceSelectorItemAvatarFallback}
                style={{ backgroundColor: getDeterministicColor(space.name) }}
              >
                {space.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{space.name}</span>
            {selectedSpace?.id === space.id && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCreateSpace}>Create space</DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewSpaces}>View spaces</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
