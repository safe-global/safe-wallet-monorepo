import type { ReactElement } from 'react'
import { PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

export interface ProfilePopoverContentProps {
  /** Name used to render the avatar initials. */
  avatarName: string
  /** Primary name/identifier shown in the popover. */
  displayName: string
  /** Optional role line (e.g. "ADMIN"). */
  role?: string
  onSignOut: () => void
  /** Extra classes appended to the popover container. */
  className?: string
}

/**
 * Shared body of the signed-in profile popover (header, name/role, sign out).
 * Rendered by both the sidebar profile section and the workspace header account menu.
 */
export const ProfilePopoverContent = ({
  avatarName,
  displayName,
  role,
  onSignOut,
  className,
}: ProfilePopoverContentProps): ReactElement => (
  <PopoverContent
    side="top"
    align="center"
    sideOffset={12}
    className={cn(css.profilePopover, className)}
    data-testid="sidebar-profile-popover"
  >
    <div className={css.profileHeader}>
      <InitialsAvatar name={avatarName} size="medium" rounded />
      <span className={css.profileSignedIn}>Signed in</span>
    </div>

    <div className={css.profileInfo}>
      <span className={css.profileName}>{displayName}</span>
      {role && <span className={css.profileRole}>{role}</span>}
    </div>

    <Separator />

    <button
      type="button"
      className={css.profileSignOut}
      onClick={onSignOut}
      data-testid="sidebar-profile-sign-out"
      aria-label="Sign out"
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span>Sign out</span>
    </button>
  </PopoverContent>
)
