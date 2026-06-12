/**
 * @deprecated Legacy MUI Header component, replaced by TopBar (`./Topbar`).
 * Remove this file, index.test.tsx, and styles.module.css once the Header
 * migration to TopBar is complete.
 */
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import type { Dispatch, SetStateAction } from 'react'
import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import type { Url } from 'next/dist/shared/lib/router/router'
import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import classnames from 'classnames'
import css from './styles.module.css'
import ConnectWallet from '@/components/common/ConnectWallet'
import NetworkSelector from '@/components/common/NetworkSelector'
import NotificationCenter from '@/components/notification-center/NotificationCenter'
import SafenetStakingWidget from '@/components/common/SafenetStakingWidget'
import { AppRoutes } from '@/config/routes'
import SafeLabsLogo from '@/public/images/logo-safe-labs.svg'
import SafeLogoMobile from '@/public/images/logo-no-text.svg'
import Link from 'next/link'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useLoadFeature } from '@/features/__core__'
import { BatchingFeature } from '@/features/batching'
import { WalletConnectFeature } from '@/features/walletconnect'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { BRAND_LOGO, BRAND_NAME } from '@/config/constants'
import useLogout from '@/hooks/useLogout'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/featureToggled'

type HeaderProps = {
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

export function getLogoLink(): Url {
  return AppRoutes.welcome.accounts
}

const Header = ({ onMenuToggle, onBatchToggle }: HeaderProps): ReactElement => {
  const safeAddress = useSafeAddress()
  const showSafeToken = useSafeTokenEnabled()
  const isProposer = useIsWalletProposer()
  const isSafeOwner = useIsSafeOwner()
  const router = useRouter()
  const { BatchIndicator } = useLoadFeature(BatchingFeature)
  const { WalletConnectWidget } = useLoadFeature(WalletConnectFeature)
  const isOfficialHost = useIsOfficialHost()
  const authenticated = useAppSelector(isAuthenticated)
  const { logout } = useLogout()
  const isOidcAuthEnabled = useHasFeature(FEATURES.OIDC_AUTH)

  const logoHref = getLogoLink()

  const handleMenuToggle = () => {
    if (onMenuToggle) {
      onMenuToggle((isOpen) => !isOpen)
    } else {
      router.push(logoHref)
    }
  }

  const handleBatchToggle = () => {
    if (onBatchToggle) {
      onBatchToggle((isOpen) => !isOpen)
    }
  }

  const showBatchButton = safeAddress && (!isProposer || isSafeOwner)

  return (
    <div className={css.container}>
      <div className={classnames(css.element, css.menuButton)}>
        {onMenuToggle && (
          <Button variant="ghost" size="icon-lg" onClick={handleMenuToggle} aria-label="menu">
            <Menu className="size-6" />
          </Button>
        )}
      </div>

      <div className={classnames(css.element, css.logoMobile)}>
        <Link href={logoHref} passHref>
          {isOfficialHost ? <SafeLogoMobile alt="Safe logo" /> : null}
        </Link>
      </div>

      <div className={classnames(css.element, css.hideMobile, css.logo)}>
        <Link href={logoHref} passHref>
          {isOfficialHost ? <SafeLabsLogo alt={BRAND_NAME} /> : BRAND_LOGO && <img src={BRAND_LOGO} alt={BRAND_NAME} />}
        </Link>
      </div>

      {showSafeToken && (
        <div className={classnames(css.element, css.hideMobile)}>
          <SafenetStakingWidget />
        </div>
      )}

      <div className={css.rightSideGroup}>
        <div data-testid="notifications-center" className={css.element}>
          <NotificationCenter />
        </div>

        {showBatchButton && (
          <div className={classnames(css.element, css.hideMobile)}>
            <BatchIndicator onClick={handleBatchToggle} />
          </div>
        )}

        <div className={classnames(css.element, css.hideMobile)}>
          <WalletConnectWidget />
        </div>
      </div>

      <div className={classnames(css.element, css.connectWallet)}>
        <Track label={OVERVIEW_LABELS.top_bar} {...OVERVIEW_EVENTS.OPEN_ONBOARD}>
          <ConnectWallet />
        </Track>
      </div>

      {/* TODO temporary sign out button til Spaces are not signer-protected */}
      {isOidcAuthEnabled && authenticated && (
        <div className={classnames(css.element, css.signOut)}>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
            <LogOut className="size-6" />
          </Button>
        </div>
      )}

      {safeAddress && (
        <div className={classnames(css.element, css.networkSelector)}>
          <NetworkSelector offerSafeCreation compactButton={true} />
        </div>
      )}
    </div>
  )
}

export default Header
