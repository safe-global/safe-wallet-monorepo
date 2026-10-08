import Identicon from '@/components/common/Identicon'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useChain } from '@/hooks/useChains'
import { useWalletName } from '@/hooks/wallets/useWalletName'
import WalletBalance from '@/components/common/WalletBalance'
import { getNativeTokenDisplay, NATIVE_TOKEN_DISPLAY_DEFAULT } from '@safe-global/utils/utils/chains'
import { WalletIdenticonView, WalletOverviewView } from '@views/components/common/WalletOverview/WalletOverviewView'

export const WalletIdenticon = ({ wallet, size = 32 }: { wallet: ConnectedWallet; size?: number }) => {
  return (
    <WalletIdenticonView
      provider={wallet.label}
      icon={wallet.icon}
      size={size}
      identicon={<Identicon address={wallet.address} size={size} />}
    />
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
  const { showWalletBalance } = walletChain ? getNativeTokenDisplay(walletChain) : NATIVE_TOKEN_DISPLAY_DEFAULT
  const ens = useWalletName(wallet)

  return (
    <WalletOverviewView
      ens={ens}
      identicon={<WalletIdenticon wallet={wallet} />}
      renderAddress={(props) => (
        <EthHashInfo prefix={walletChain?.shortName || ''} address={wallet.address} {...props} />
      )}
      showBalance={Boolean(showBalance && showWalletBalance)}
      balance={<WalletBalance balance={balance} />}
    />
  )
}

export default WalletOverview
