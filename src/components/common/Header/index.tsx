import type { Dispatch, SetStateAction } from 'react'
import { type ReactElement } from 'react'
import { useRouter } from 'next/navigation'
import { IconButton, Paper, SvgIcon } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import classnames from 'classnames'
import css from './styles.module.css'
import Link from 'next/link'
import BellIcon from '@/public/images/common/notifications.svg'
import WalletConnect from '@/features/walletconnect/components'
import SuperChainEco from '@/public/images/common/superchain-eco.svg'
import Image from 'next/image'
import ConnectWallet from '../ConnectWallet'
import NotificationCenter from '@/components/notification-center/NotificationCenter'

type HeaderProps = {
  onMenuToggle?: Dispatch<SetStateAction<boolean>>
  onBatchToggle?: Dispatch<SetStateAction<boolean>>
}

const Header = ({ onMenuToggle }: HeaderProps): ReactElement => {
  const router = useRouter()
  const logoHref = '/#'

  const handleMenuToggle = () => {
    if (onMenuToggle) {
      onMenuToggle((isOpen) => !isOpen)
    } else {
      router.push(logoHref)
    }
  }

  return (
    <Paper className={css.container}>
      <div className={classnames(css.element, css.menuButton, !onMenuToggle ? css.hideSidebarMobile : null)}>
        <IconButton onClick={handleMenuToggle} size="large" color="default" aria-label="menu">
          <MenuIcon />
        </IconButton>
      </div>

      <div className={classnames(css.element, css.hideMobile, css.logo)}>
        <Link href={logoHref} passHref>
          <SvgIcon component={SuperChainEco} inheritViewBox style={{ width: '200px', height: '100px' }} />
        </Link>
      </div>

      <div className={classnames(css.element)}>
        <NotificationCenter />
      </div>

      <div className={classnames(css.element, css.hideMobile)}>
        <WalletConnect />
      </div>
      <div className={classnames(css.element, css.networkSelector)}>
        <span data-testid="chain-logo" className={classnames(css.element, css.inline)}>
          <Image
            src="https://safe-transaction-assets.safe.global/chains/10/chain_logo.png"
            alt="Optimism Logo"
            width={24}
            height={24}
            loading="lazy"
          />

          <span className={css.name}>Optimism</span>
        </span>
      </div>
      <div className={classnames(css.element, css.button)}>
        <ConnectWallet />
      </div>
    </Paper>
  )
}

export default Header
