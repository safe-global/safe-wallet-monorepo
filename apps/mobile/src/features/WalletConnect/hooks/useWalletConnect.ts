import { useCallback } from 'react'
import { useAccount, useAppKit, useProvider, useWalletInfo } from '@reown/appkit-react-native'
import type { Provider } from '@reown/appkit-common-react-native'

export type WalletConnect = {
  open: () => void
  switchNetwork: (chainId: string) => void
  provider: Provider | undefined
  isConnected: boolean
  address: string | undefined
  chainId: string | undefined
  walletInfo: ReturnType<typeof useWalletInfo>['walletInfo']
}

export function useWalletConnect(): WalletConnect {
  const { open: openAppKit, switchNetwork: switchNetworkAppKit } = useAppKit()
  const { address, isConnected, chainId } = useAccount()
  const { walletInfo } = useWalletInfo()
  const { provider } = useProvider()

  const open = useCallback(() => {
    openAppKit({ view: 'Connect' })
  }, [openAppKit])

  const switchNetwork = useCallback(
    (chainId: string) => {
      switchNetworkAppKit(`eip155:${chainId}`)
    },
    [switchNetworkAppKit],
  )

  return { open, switchNetwork, isConnected, address, chainId, walletInfo, provider }
}
