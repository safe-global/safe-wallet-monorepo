import type { ReactElement } from 'react'
import { PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'

export interface ProfilePopoverContentProps {
  avatarName: string
  displayName: string
  role?: string
  signerAddress?: string
  connectedWallet?: string
  onSignOut: () => void
}

export const ProfilePopoverContent = ({
  avatarName,
  displayName,
  role,
  signerAddress,
  connectedWallet,
  onSignOut,
}: ProfilePopoverContentProps): ReactElement => (
  <PopoverContent
    side="bottom"
    align="end"
    sideOffset={12}
    className={css.profilePopover}
    data-testid="sidebar-profile-popover"
  >
    <div className={css.profileSection}>
      <span className={css.profileSectionLabel}>Your account</span>

      <div className={css.profileIdentity}>
        {signerAddress ? (
          <Identicon address={signerAddress} size={32} />
        ) : (
          <InitialsAvatar name={avatarName} size="medium" rounded />
        )}
        <span className={css.profileName}>{displayName}</span>
      </div>

      <span className={css.profileSectionCaption}>Manages your Safe Pro subscription.</span>
      {role && <span className={css.profileRole}>{role}</span>}
    </div>

    {connectedWallet && (
      <>
        <Separator className={css.profileDivider} />

        <div className={css.profileSection} data-testid="sidebar-profile-wallet-hint">
          <span className={css.profileSectionLabel}>Connected wallet</span>

          <div className={css.profileIdentity}>
            <Identicon address={connectedWallet} size={32} />
            <span className={css.profileName}>{shortenAddress(connectedWallet)}</span>
          </div>

          <span className={css.profileSectionCaption}>Signs and executes transactions.</span>
        </div>
      </>
    )}

    <Separator className={css.profileDivider} />

    <button
      type="button"
      className={css.profileSignOut}
      onClick={onSignOut}
      data-testid="sidebar-profile-sign-out"
      aria-label="Sign out"
    >
      <LogOut className="size-4" strokeWidth={2.5} aria-hidden="true" />
      <span>Sign out</span>
    </button>
  </PopoverContent>
)
