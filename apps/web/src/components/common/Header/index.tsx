import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import type { Dispatch, SetStateAction } from 'react'
import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import type { Url } from 'next/dist/shared/lib/router/router'
import { Box, IconButton, Paper } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import classnames from 'classnames'
import css from './styles.module.css'
import ConnectWallet from '@/components/common/ConnectWallet'
import NetworkSelector from '@/components/common/NetworkSelector'
import SafeTokenWidget from '@/components/common/SafeTokenWidget'
import NotificationCenter from '@/components/notification-center/NotificationCenter'
import { AppRoutes } from '@/config/routes'
import SafeLabsLogo from '@/public/images/logo-safe-labs.svg'
import SafeLogoMobile from '@/public/images/logo-no-text.svg'
import Link from 'next/link'
import useSafeAddress from '@/hooks/useSafeAddress'
import BatchIndicator from '@/components/batch/BatchIndicator'
import { useLoadFeature } from '@/features/__core__'
import { WalletConnectFeature } from '@/features/walletconnect'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_LOGO, BRAND_NAME } from '@/config/constants'
import { useAppSelector } from '@/store'
import { lastUsedSpace } from '@/store/authSlice'

type HeaderProps = {
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

export function getLogoLink(router: ReturnType<typeof useRouter>, spaceId?: string | null): Url {
  if (router.pathname !== AppRoutes.home && router.query.safe) {
    return { pathname: AppRoutes.home, query: { safe: router.query.safe } }
  }
  if (spaceId) {
    return { pathname: AppRoutes.spaces.index, query: { spaceId } }
  }
  return router.pathname === AppRoutes.welcome.accounts ? AppRoutes.welcome.index : AppRoutes.welcome.accounts
}

const Header = ({ onMenuToggle, onBatchToggle }: HeaderProps): ReactElement => {
  const safeAddress = useSafeAddress()
  const showSafeToken = useSafeTokenEnabled()
  const isProposer = useIsWalletProposer()
  const isSafeOwner = useIsSafeOwner()
  const router = useRouter()
  const { WalletConnectWidget } = useLoadFeature(WalletConnectFeature)
  const isOfficialHost = useIsOfficialHost()
  const spaceId = useAppSelector(lastUsedSpace)

  // If on the home page, the logo should link back to the space (if any), else to accounts
  const logoHref = getLogoLink(router, spaceId)

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
          {isOfficialHost ? <SafeLabsLogo alt={BRAND_NAME} /> : BRAND_LOGO && <img src={BRAND_LOGO} alt={BRAND_NAME} />}
        </Link>
      </div>

      {showSafeToken && (
        <div className={classnames(css.element, css.hideMobile)}>
          <SafeTokenWidget />
        </div>
      )}

      <Box className={css.rightSideGroup}>
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
      </Box>

      <div className={classnames(css.element, css.connectWallet)}>
        <Track label={OVERVIEW_LABELS.top_bar} {...OVERVIEW_EVENTS.OPEN_ONBOARD}>
          <ConnectWallet />
        </Track>
      </div>

      {safeAddress && (
        <div className={classnames(css.element, css.networkSelector)}>
          <NetworkSelector offerSafeCreation compactButton={true} />
        </div>
      )}
    </Paper>
  )
}

export default Header
