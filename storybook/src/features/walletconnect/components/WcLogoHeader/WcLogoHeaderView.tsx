import type { ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import WalletConnect from '@/public/images/common/walletconnect.svg'
import Alert from '@/public/images/notifications/alert.svg'
import css from './styles.module.css'

export type WcLogoHeaderViewProps = {
  errorMessage?: string
  brandName: string
}

export const WcLogoHeaderView = ({ errorMessage, brandName }: WcLogoHeaderViewProps): ReactElement => {
  return (
    <>
      <div className="flex items-end justify-center">
        <WalletConnect data-testid="wc-icon" className={`size-[50px] ${css.icon}`} />
        {errorMessage && <Alert data-testid="wc-alert" className={`size-5 ${css.errorBadge}`} />}
      </div>

      <Typography data-testid="wc-title" variant="h4" className={`mt-4 mb-1 ${css.title}`}>
        {errorMessage || `Connect dApps to ${brandName}`}
      </Typography>
    </>
  )
}
