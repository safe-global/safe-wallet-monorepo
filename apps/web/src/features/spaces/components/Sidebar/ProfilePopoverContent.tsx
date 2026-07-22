import type { ReactElement } from 'react'
import { PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import css from './styles.module.css'

export interface ProfilePopoverContentProps {
  /** Name used to render the avatar initials. */
  avatarName: string
  /** Primary name/identifier shown in the popover. */
  displayName: string
  /** Optional role line (e.g. "ADMIN"). */
  role?: string
  onSignOut: () => void
}

/**
 * Body of the signed-in profile popover (header, name/role, sign out), rendered
 * by the top-bar account menu. Opens below the account icon and is right-aligned
 * so its trailing edge lines up with the icon.
 */
export const ProfilePopoverContent = ({
  avatarName,
  displayName,
  role,
  onSignOut,
}: ProfilePopoverContentProps): ReactElement => (
  <PopoverContent
    side="bottom"
    align="end"
    sideOffset={12}
    className={css.profilePopover}
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
