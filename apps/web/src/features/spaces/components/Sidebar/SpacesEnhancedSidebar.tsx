import React, { type ReactElement } from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { EnhancedSidebar } from './index'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { getNonDeclinedSpaces } from '@/features/spaces/utils'

export const SpacesEnhancedSidebar = (): ReactElement => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()

  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  const selectedSpace = spaces?.find((space) => space.id === Number(spaceId))
  const nonDeclinedSpaces = getNonDeclinedSpaces(currentUser, spaces ?? [])

  const spaceName = selectedSpace?.name ?? ''
  const spaceInitial = spaceName.charAt(0).toUpperCase()

  const spacesSidebarWidth = 'min(230px, 100%)'

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': spacesSidebarWidth,
        } as React.CSSProperties
      }
    >
      <EnhancedSidebar
        type="spaces"
        spaceName={spaceName}
        spaceInitial={spaceInitial}
        selectedSpace={selectedSpace}
        spaces={nonDeclinedSpaces}
      />
    </SidebarProvider>
  )
}
