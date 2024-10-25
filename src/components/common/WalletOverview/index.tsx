import Identicon from '@/components/common/Identicon'
import { Box, Typography } from '@mui/material'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useAppSelector } from '@/store'
import { selectChainById } from '@/store/chainsSlice'
import WalletBalance from '@/components/common/WalletBalance'

import css from './styles.module.css'
import { isSocialLoginWallet } from '@/services/mpc/SocialLoginModule'
import SocialLoginInfo from '@/components/common/SocialLoginInfo'

export const WalletIdenticon = ({ wallet, size = 32 }: { wallet: ConnectedWallet; size?: number }) => {
  return (
    <Box className={css.imageContainer}>
      <Identicon address={wallet.address} size={size} />
      {/* <Suspense>
        <Box className={css.walletIcon}>
          <WalletIcon provider={wallet.label} icon={wallet.icon} width={size / 2} height={size / 2} />
        </Box>
      </Suspense> */}
    </Box>
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
  const walletChain = useAppSelector((state) => selectChainById(state, wallet.chainId))
  const prefix = walletChain?.shortName

  const isSocialLogin = isSocialLoginWallet(wallet.label)

  if (isSocialLogin) {
    return (
      <div className={css.socialLoginInfo}>
        <SocialLoginInfo
          wallet={wallet}
          chainInfo={walletChain}
          hideActions={true}
          balance={balance}
          showBalance={showBalance}
        />
      </div>
    )
  }

  return (
    <Box className={css.container}>
      <WalletIdenticon wallet={wallet} />

      <Box className={css.walletDetails}>
        <Typography variant="body2" component="div">
          {wallet.ens ? (
            <div>{wallet.ens}</div>
          ) : (
            <EthHashInfo
              prefix={prefix || ''}
              address={wallet.address}
              showName={false}
              showAvatar={false}
              avatarSize={12}
              hasExplorer={true}
              copyAddress={true}
            />
          )}
        </Typography>

        {showBalance && (
          <Typography variant="caption" component="div" fontWeight="bold" display={{ xs: 'none', sm: 'block' }}>
            <WalletBalance balance={balance} />
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default WalletOverview
