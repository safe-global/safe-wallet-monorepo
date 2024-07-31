import { SvgIcon, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import WalletConnect from '@/public/images/common/walletconnect.svg'
import Alert from '@/public/images/notifications/alert.svg'
import css from './styles.module.css'

const WcLogoHeader = ({ errorMessage }: { errorMessage?: string }): ReactElement => {
  return (
    <>
      <div>
        <SvgIcon component={WalletConnect} inheritViewBox className={css.icon} />
        {errorMessage && <SvgIcon component={Alert} inheritViewBox className={css.errorBadge} fontSize="small" />}
      </div>

      <Typography variant="h5" mt={2} mb={0.5} className={css.title}>
        {errorMessage || 'Connect dApps to SuperChain SA'}
      </Typography>
    </>
  )
}

export default WcLogoHeader
