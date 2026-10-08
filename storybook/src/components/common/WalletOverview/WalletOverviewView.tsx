import { Typography } from '@/components/ui/typography'
import { Suspense } from 'react'
import type { ReactElement, ReactNode } from 'react'

import WalletIcon from '@/components/common/WalletIcon'

import css from './styles.module.css'

export type WalletIdenticonViewProps = {
  provider: string
  icon?: string
  size: number
  /** The Identicon container, at `size` */
  identicon: ReactNode
}

export const WalletIdenticonView = ({ provider, icon, size, identicon }: WalletIdenticonViewProps): ReactElement => {
  return (
    <div className={css.imageContainer}>
      {identicon}
      <Suspense>
        <div className={css.walletIcon}>
          <WalletIcon provider={provider} icon={icon} width={size / 2} height={size / 2} />
        </div>
      </Suspense>
    </div>
  )
}

export type WalletOverviewViewProps = {
  ens?: string
  identicon: ReactNode
  /** Renders the EthHashInfo container for the wallet address */
  renderAddress: (props: {
    showName: boolean
    showAvatar: boolean
    avatarSize: number
    copyAddress: boolean
  }) => ReactNode
  showBalance: boolean
  balance: ReactNode
}

export function WalletOverviewView({
  ens,
  identicon,
  renderAddress,
  showBalance,
  balance,
}: WalletOverviewViewProps): ReactElement {
  return (
    <div className={css.container}>
      {identicon}

      <div className={css.walletDetails}>
        <div className="text-sm leading-5 font-normal">
          {ens ? (
            <div>{ens}</div>
          ) : (
            renderAddress({ showName: false, showAvatar: false, avatarSize: 12, copyAddress: false })
          )}
        </div>

        {showBalance && (
          <Typography variant="paragraph-mini-bold" className="hidden sm:block">
            {balance}
          </Typography>
        )}
      </div>
    </div>
  )
}
