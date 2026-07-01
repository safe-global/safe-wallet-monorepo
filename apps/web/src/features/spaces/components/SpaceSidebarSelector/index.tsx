import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import SpaceCard from '../SpaceCard'
import InitialsAvatar from '@/components/common/InitialsAvatar'

import css from './styles.module.css'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useCurrentSpaceId } from '@/features/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { SPACE_LABELS, SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import { getNonDeclinedSpaces } from '@/features/spaces/utils'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'

const SpaceSidebarSelector = () => {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const isDarkMode = useDarkMode()
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const selectedSpace = spaces?.find((space) => space.uuid === spaceId)

  const nonDeclinedSpaces = getNonDeclinedSpaces(currentUser, spaces || [])

  const handleClose = () => {
    setOpen(false)
  }

  const handleSelectSpace = (space: GetSpaceResponse) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, spaceId: space.uuid },
    })

    handleClose()
  }

  if (!selectedSpace) return null

  return (
    <div className={cn('shadcn-scope flex w-full', isDarkMode && 'dark')}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              data-testid="space-selector-button"
              id="space-selector-button"
              variant="ghost"
              className={cn('w-full', css.spaceSelectorButton)}
            />
          }
        >
          <div className="flex items-center gap-2">
            <InitialsAvatar name={selectedSpace.name} size="small" />
            <Typography
              variant="paragraph-small-bold"
              className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {selectedSpace.name}
            </Typography>
          </div>
          <ChevronDown
            className={cn('size-4 text-[var(--color-border-main)] transition-transform', open && 'rotate-180')}
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent data-testid="space-selector-menu" className="min-w-[260px]">
          <SpaceCard space={selectedSpace} isCompact isLink={false} currentUserId={currentUser?.id} />

          <DropdownMenuSeparator className="mb-1" />

          {nonDeclinedSpaces.map((space) => (
            <DropdownMenuItem
              key={space.uuid}
              onClick={() => handleSelectSpace(space)}
              className="flex justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <InitialsAvatar name={space.name} size="small" />
                <Typography variant="paragraph-small">{space.name}</Typography>
              </div>
              {space.uuid === selectedSpace.uuid && <Check className="size-4 text-[var(--color-primary-main)]" />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="font-bold"
            onClick={() => {
              handleClose()
              trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.SIDEBAR })
              router.push(AppRoutes.spaces.createSpace)
            }}
          >
            Create workspace
          </DropdownMenuItem>

          <DropdownMenuItem
            className="font-bold"
            onClick={() => {
              handleClose()
              trackEvent({ ...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE, label: SPACE_LABELS.space_selector })
              router.push(AppRoutes.welcome.spaces)
            }}
          >
            View workspaces
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default SpaceSidebarSelector
