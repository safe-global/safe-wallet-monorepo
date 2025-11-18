import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import type { Dispatch, SetStateAction } from 'react'
import { useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import type { Url } from 'next/dist/shared/lib/router/router'
import { Box, Button, IconButton, Paper } from '@mui/material'
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
import { useLoadFeature } from '@/features/__core__'
import { BatchingFeature } from '@/features/batching'
import { WalletConnectFeature } from '@/features/walletconnect'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_LOGO, BRAND_NAME, SUPPORT_CHAT_APP_ID, SUPPORT_CHAT_ENABLED } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { SupportChatDrawer } from '@safe-global/support-chat-embed'
import { useSupportChat } from '@/hooks/useSupportChat'

type HeaderProps = {
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

export function getLogoLink(router: ReturnType<typeof useRouter>): Url {
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
  const { BatchIndicator } = useLoadFeature(BatchingFeature)
  const { WalletConnectWidget } = useLoadFeature(WalletConnectFeature)
  const isOfficialHost = useIsOfficialHost()
  const [isSupportOpen, setSupportOpen] = useState(false)
  const { config, user } = useSupportChat()

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
  const showSupport = Boolean(SUPPORT_CHAT_ENABLED && isOfficialHost && SUPPORT_CHAT_APP_ID)

  const handleSupportOpen = () => setSupportOpen(true)
  const handleSupportClose = () => setSupportOpen(false)

  return (
    <>
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

      <Box className={css.rightSideGroup}>
        <div data-testid="notifications-center" className={css.element}>
          <NotificationCenter />
        </div>

        {showSupport && (
          <div className={classnames(css.element, css.hideMobile)}>
            <Button
              color="primary"
              variant="text"
              startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
              onClick={handleSupportOpen}
            >
              Support
            </Button>
          </div>
        )}

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

    <SupportChatDrawer open={isSupportOpen} onClose={handleSupportClose} config={config} user={user} />
  </>
  )
}

export default Header
