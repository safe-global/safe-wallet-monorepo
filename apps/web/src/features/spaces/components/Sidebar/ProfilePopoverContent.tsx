import type { ReactElement } from 'react'
import { PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { LogOut } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import css from './styles.module.css'

export interface ProfilePopoverContentProps {
  /** Name used to render the avatar initials. */
  avatarName: string
  /** Primary name/identifier shown in the popover. */
  displayName: string
  /** Optional role line (e.g. "ADMIN"). */
  role?: string
  /** Full signer address; renders its identicon beside the identity for wallet sign-ins. */
  signerAddress?: string
  /** Connected wallet address; when set, explains how it relates to the signed-in account. */
  connectedWallet?: string
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
    <div className={css.profileHeader}>
      {!signerAddress && <InitialsAvatar name={avatarName} size="medium" rounded />}
      <span className={css.profileSignedIn}>Signed in as</span>
    </div>

    <div className={css.profileInfo}>
      <span className={css.profileIdentity}>
        {signerAddress && <Identicon address={signerAddress} size={20} />}
        <span className={css.profileName}>{displayName}</span>
      </span>
      {role && <span className={css.profileRole}>{role}</span>}
    </div>

    {connectedWallet && (
      <div className={css.profileWalletHint} data-testid="sidebar-profile-wallet-hint">
        Your account and your connected wallet are separate. Wallet{' '}
        <span className={css.profileWalletHintAddress}>
          <Identicon address={connectedWallet} size={14} />
          {shortenAddress(connectedWallet)}
        </span>{' '}
        is connected for signing transactions.
      </div>
    )}

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
