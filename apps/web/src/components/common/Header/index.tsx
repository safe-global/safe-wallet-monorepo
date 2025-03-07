import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import type { Dispatch, SetStateAction } from 'react'
import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import type { Url } from 'next/dist/shared/lib/router/router'
import { IconButton, Paper } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import classnames from 'classnames'
import css from './styles.module.css'
import ConnectWallet from '@/components/common/ConnectWallet'
import NetworkSelector from '@/components/common/NetworkSelector'
import SafeTokenWidget from '@/components/common/SafeTokenWidget'
import NotificationCenter from '@/components/notification-center/NotificationCenter'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/public/images/logo.svg'
import SafeLogoMobile from '@/public/images/logo-no-text.svg'
import Link from 'next/link'
import useSafeAddress from '@/hooks/useSafeAddress'
import BatchIndicator from '@/components/batch/BatchIndicator'
import WalletConnect from '@/features/walletconnect/components'
import { FEATURES } from '@/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_LOGO, BRAND_NAME } from '@/config/constants'

type HeaderProps = {
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

function getLogoLink(router: ReturnType<typeof useRouter>): Url {
  return router.pathname === AppRoutes.home || !router.query.safe
    ? router.pathname === AppRoutes.welcome.accounts
      ? AppRoutes.welcome.index
      : AppRoutes.welcome.accounts
    : { pathname: AppRoutes.home, query: { safe: router.query.safe } }
}

const Header = ({ onMenuToggle, onBatchToggle }: HeaderProps): ReactElement => {
  const safeAddress = useSafeAddress()
  const showSafeToken = useSafeTokenEnabled()
  const isProposer = useIsWalletProposer()
  const isSafeOwner = useIsSafeOwner()
  const router = useRouter()
  const enableWc = useHasFeature(FEATURES.NATIVE_WALLETCONNECT)
  const isOfficialHost = useIsOfficialHost()

  // If on the home page, the logo should link to the Accounts or Welcome page, otherwise to the home page
  const logoHref = getLogoLink(router)

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
    <Paper className={css.container}>
      <div className={classnames(css.element, css.menuButton)}>
        {onMenuToggle && (
          <IconButton onClick={handleMenuToggle} size="large" color="default" aria-label="menu">
            <MenuIcon />
          </IconButton>
        )}
      </div>

      <div className={classnames(css.element, css.logoMobile)}>
        <Link href={logoHref} passHref>
          {isOfficialHost ? <SafeLogoMobile alt="Safe logo" /> : null}
        </Link>
      </div>

      <div className={classnames(css.element, css.hideMobile, css.logo)}>
        <Link href={logoHref} passHref>
          {isOfficialHost ? <SafeLogo alt={BRAND_NAME} /> : BRAND_LOGO && <img src={BRAND_LOGO} alt={BRAND_NAME} />}
        </Link>
      </div>

      {showSafeToken && (
        <div className={classnames(css.element, css.hideMobile)}>
          <SafeTokenWidget />
        </div>
      )}

      <div data-testid="notifications-center" className={css.element}>
        <NotificationCenter />
      </div>

      {showBatchButton && (
        <div className={classnames(css.element, css.hideMobile)}>
          <BatchIndicator onClick={handleBatchToggle} />
        </div>
      )}

      {enableWc && (
        <div className={classnames(css.element, css.hideMobile)}>
          <WalletConnect />
        </div>
      )}

      <div className={classnames(css.element, css.connectWallet)}>
        <Track label={OVERVIEW_LABELS.top_bar} {...OVERVIEW_EVENTS.OPEN_ONBOARD}>
          <ConnectWallet />
        </Track>
      </div>

      {safeAddress && (
        <div className={classnames(css.element, css.networkSelector)}>
          <NetworkSelector offerSafeCreation />
        </div>
      )}
    </Paper>
  )
}

export default Header
