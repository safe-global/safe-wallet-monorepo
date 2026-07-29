import type { ReactElement } from 'react'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getDeterministicColor } from '@/utils/colors'
import { useSpaceBackLink } from '@/components/common/SpaceSafeBar/hooks/useSpaceBackLink'
import { icons } from '../config'
import css from '../styles.module.css'
import type { SafeWorkspaceHeaderBackToSpace } from '../types'

const getSpaceInitial = (name: string | undefined, initial: string | undefined): string =>
  initial ?? (name?.charAt(0) ?? '').toUpperCase()

export const BackToSpaceButton = ({ spaceName, spaceInitial }: SafeWorkspaceHeaderBackToSpace): ReactElement => {
  const { handleBackToSpace } = useSpaceBackLink()
  const initial = getSpaceInitial(spaceName, spaceInitial)
  const spaceAvatarColor = spaceName ? getDeterministicColor(spaceName) : undefined

  return (
    <SidebarMenuButton
      size="lg"
      tooltip="Back to workspace"
      data-testid="back-to-space-button"
      className={css.spaceSelector}
      onClick={handleBackToSpace}
    >
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
      <icons.ChevronLeft className="ml-auto size-4 shrink-0" aria-hidden />
    </SidebarMenuButton>
  )
}
