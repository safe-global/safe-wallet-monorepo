import WalletOverview from '@/components/common/WalletOverview'
import useWallet from '@/hooks/wallets/useWallet'
import type { ReactElement } from 'react'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosList } from '@/features/multichain'
import { OverviewWidgetView } from '@views/components/new-safe/create/OverviewWidget/OverviewWidgetView'

const OverviewWidget = ({ safeName, networks }: { safeName: string; networks: Chain[] }): ReactElement | null => {
  const wallet = useWallet()

  return (
    <OverviewWidgetView
      safeName={safeName}
      hasWallet={!!wallet}
      walletOverview={wallet && <WalletOverview wallet={wallet} />}
      hasNetworks={networks.length > 0}
      networkLogos={<NetworkLogosList networks={networks} />}
      connectWalletButton={<ConnectWalletButton fullWidth />}
    />
  )
}

export default OverviewWidget
