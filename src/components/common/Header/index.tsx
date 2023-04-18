import type { Dispatch, SetStateAction } from 'react'
import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { IconButton, Paper } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import classnames from 'classnames'
import css from './styles.module.css'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import ConnectWallet from '@/components/common/ConnectWallet'
import NetworkSelector from '@/components/common/NetworkSelector'
import SafeTokenWidget, { getSafeTokenAddress } from '@/components/common/SafeTokenWidget'
import NotificationCenter from '@/components/notification-center/NotificationCenter'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import SafeLogo from '@/public/images/logo-celo.svg'
import Link from 'next/link'
import useSafeAddress from '@/hooks/useSafeAddress'

type HeaderProps = {
  onMenuToggle: Dispatch<SetStateAction<boolean>>
}

const FORUM_POST_URL = 'https://forum.celo.org/t/multisig-celo-safe-re-launch/4529/25?u=0xarthurxyz'
const OLD_SAFE_URL = 'https://old-safe.celo.org'

const Header = ({ onMenuToggle }: HeaderProps): ReactElement => {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const showSafeToken = safeAddress && !!getSafeTokenAddress(chainId)
  const router = useRouter()

  // Logo link: if on Dashboard, link to Welcome, otherwise to the root (which redirects to either Dashboard or Welcome)
  const logoHref = router.pathname === AppRoutes.home ? AppRoutes.welcome : AppRoutes.index

  const handleMenuToggle = () => {
    onMenuToggle((isOpen) => !isOpen)
  }

  return (
    <Paper className={css.container}>
      <div className={classnames(css.element, css.menuButton)}>
        <IconButton onClick={handleMenuToggle} size="large" edge="start" color="default" aria-label="menu">
          <MenuIcon />
        </IconButton>
      </div>

      <div className={classnames(css.element, css.hideMobile, css.logo)}>
        <Link href={logoHref} passHref>
          <a>
            <SafeLogo alt="Safe logo" />
          </a>
        </Link>
        <span className={css.hideMobile}>
          Celo Safe is now supported on the official{' '}
          <a target="_blank" rel="noreferrer" href="https://app.safe.global/welcome?chain=celo">
            Safe app.
          </a>{' '}
          Learn more{' '}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://forum.celo.org/t/multisig-native-safe-launch-migration-guidance/5705"
          >
            here.
          </a>{' '}
          Use the old version{' '}
          <a target="_blank" rel="noreferrer" href={OLD_SAFE_URL}>
            here
          </a>
          .
        </span>
      </div>

      <div className={classnames(css.element, css.hideMobile)}>
        <ChainSwitcher />
      </div>

      {showSafeToken && (
        <div className={classnames(css.element, css.hideMobile)}>
          <SafeTokenWidget />
        </div>
      )}

      <div className={classnames(css.element, css.hideMobile)}>
        <NotificationCenter />
      </div>

      <div className={css.element}>
        <ConnectWallet />
      </div>

      <div className={classnames(css.element, css.networkSelector)}>
        <NetworkSelector />
      </div>
    </Paper>
  )
}

export default Header
