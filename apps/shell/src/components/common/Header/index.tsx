import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Paper } from '@mui/material'
import classnames from 'classnames'
import css from './styles.module.css'
import ConnectWallet from '@/components/common/ConnectWallet'
import { BRAND_NAME } from '@/config/constants'
import Link from 'next/link'
import { ShellRoutes } from '@/config/routes'

const Header = (): ReactElement => {
  const router = useRouter()

  // Logo links to welcome page when on home, otherwise to home
  const logoHref = router.pathname === ShellRoutes.index ? ShellRoutes.welcome.index : ShellRoutes.index

  return (
    <Paper className={css.container}>
      <div className={classnames(css.element, css.logo)}>
        <Link href={logoHref} passHref>
          <span className={css.brandName}>{BRAND_NAME}</span>
        </Link>
      </div>

      <div className={classnames(css.element, css.connectWallet)}>
        <ConnectWallet />
      </div>
    </Paper>
  )
}

export default Header
