import Identicon from '@/components/common/Identicon'
import { Typography } from '@/components/ui/typography'
import { Suspense } from 'react'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import WalletIcon from '@/components/common/WalletIcon'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useChain } from '@/hooks/useChains'
import WalletBalance from '@/components/common/WalletBalance'
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'

import css from './styles.module.css'

export const WalletIdenticon = ({ wallet, size = 32 }: { wallet: ConnectedWallet; size?: number }) => {
  return (
    <div className={css.imageContainer}>
      <Identicon address={wallet.address} size={size} />
      <Suspense>
        <div className={css.walletIcon}>
          <WalletIcon provider={wallet.label} icon={wallet.icon} width={size / 2} height={size / 2} />
        </div>
      </Suspense>
    </div>
  )
}

const WalletOverview = ({
  wallet,
  balance,
  showBalance,
}: {
  wallet: ConnectedWallet
  balance?: string
  showBalance?: boolean
}): ReactElement => {
  const walletChain = useChain(wallet.chainId)
  const prefix = walletChain?.shortName
  const { showWalletBalance } = walletChain ? getNativeTokenDisplay(walletChain) : NATIVE_TOKEN_DISPLAY_DEFAULT

  return (
    <div className={css.container}>
      <WalletIdenticon wallet={wallet} />

      <div className={css.walletDetails}>
        <div className="text-sm leading-5 font-normal">
          {wallet.ens ? (
            <div>{wallet.ens}</div>
          ) : (
            <EthHashInfo
              prefix={prefix || ''}
              address={wallet.address}
              showName={false}
              showAvatar={false}
              avatarSize={12}
              copyAddress={false}
            />
          )}
        </div>

        {showBalance && showWalletBalance && (
          <Typography variant="paragraph-mini-bold" className="hidden sm:block">
            <WalletBalance balance={balance} />
          </Typography>
        )}
      </div>
    </div>
  )
}

export default WalletOverview
