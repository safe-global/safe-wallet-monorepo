import type { ReactElement } from 'react'
import { PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LogOut } from 'lucide-react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import Identicon from '@/components/common/Identicon'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import css from '@/features/spaces/components/Sidebar/styles.module.css'

export interface ProfilePopoverContentProps {
  avatarName: string
  displayName: string
  shortDisplayName?: string
  role?: string
  isMember?: boolean
  signerAddress?: string
  connectedWallet?: string
  onSignOut: () => void
}

export const ProfilePopoverContent = ({
  avatarName,
  displayName,
  shortDisplayName,
  role,
  isMember = false,
  signerAddress,
  connectedWallet,
  onSignOut,
}: ProfilePopoverContentProps): ReactElement => (
  <PopoverContent
    side="bottom"
    align="end"
    sideOffset={12}
    showBackdrop
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
        {displayName && (
          <Tooltip>
            <TooltipTrigger render={<span className={css.profileName} />}>
              {shortDisplayName || displayName}
            </TooltipTrigger>
            <TooltipContent side="top">{signerAddress || displayName}</TooltipContent>
          </Tooltip>
        )}
        {signerAddress && <CopyAddressIconButton address={signerAddress} />}
      </div>

      <span className={css.profileSectionCaption}>
        {isMember ? 'Your Safe Pro membership.' : 'Manages your Safe Pro subscription.'}
      </span>
      {role && <span className={css.profileRole}>{role}</span>}
    </div>

    {connectedWallet && (
      <>
        <Separator className={css.profileDivider} />

        <div className={css.profileSection} data-testid="sidebar-profile-wallet-hint">
          <span className={css.profileSectionLabel}>Connected wallet</span>

          <div className={css.profileIdentity}>
            <Identicon address={connectedWallet} size={32} />
            <Tooltip>
              <TooltipTrigger render={<span className={css.profileName} />}>
                {shortenAddress(connectedWallet)}
              </TooltipTrigger>
              <TooltipContent side="top">{connectedWallet}</TooltipContent>
            </Tooltip>
            <CopyAddressIconButton address={connectedWallet} />
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
