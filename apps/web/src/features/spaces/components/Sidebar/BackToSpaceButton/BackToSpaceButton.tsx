import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getDeterministicColor } from '@/features/spaces'
import { AppRoutes } from '@/config/routes'
import { icons } from '../config'
import css from '../styles.module.css'
import type { SafeWorkspaceHeaderBackToSpace } from '../types'

const getSpaceInitial = (name: string | undefined, initial: string | undefined): string =>
  initial ?? (name?.charAt(0) ?? '').toUpperCase()

export const BackToSpaceButton = ({
  spaceId,
  spaceName,
  spaceInitial,
}: SafeWorkspaceHeaderBackToSpace): ReactElement => {
  const router = useRouter()
  const initial = getSpaceInitial(spaceName, spaceInitial)
  const spaceAvatarColor = spaceName ? getDeterministicColor(spaceName) : undefined

  const handleClick = () => {
    if (!spaceId) return
    router.push({
      pathname: AppRoutes.spaces.index,
      query: { spaceId },
    })
  }

  return (
    <SidebarMenuButton
      size="lg"
      tooltip="Back to workspace"
      data-testid="back-to-space-button"
      className={css.backToSpace}
      onClick={handleClick}
    >
      <icons.ChevronLeft className={`size-4 shrink-0 ${css.backToSpaceChevron}`} />
      <Avatar className={css.spaceSelectorAvatar}>
        <AvatarFallback
          className={css.spaceSelectorAvatarFallback}
          style={spaceAvatarColor ? { backgroundColor: spaceAvatarColor } : undefined}
        >
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className={css.spaceSelectorText}>
        <span className={css.spaceSelectorName}>{spaceName}</span>
        <span className={css.spaceSelectorSubtitle}>Workspace</span>
      </div>
    </SidebarMenuButton>
  )
}
