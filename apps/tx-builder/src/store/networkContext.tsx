import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react'
import SafeAppsSDK, { ChainInfo, SafeInfo } from '@safe-global/safe-apps-sdk'
import { BrowserProvider } from 'ethers'
import InterfaceRepository, { InterfaceRepo } from '../lib/interfaceRepository'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { SafeAppProvider } from '@safe-global/safe-apps-provider'

type NetworkContextProps = {
  sdk: SafeAppsSDK
  safe: SafeInfo
  chainInfo: ChainInfo | undefined
  provider: BrowserProvider | undefined
  interfaceRepo: InterfaceRepo | undefined
  networkPrefix: string
  nativeCurrencySymbol: string | undefined
  getAddressFromDomain: (name: string) => Promise<string>
}

export const NetworkContext = createContext<NetworkContextProps | null>(null)

const NetworkProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { sdk, safe } = useSafeAppsSDK()
  const [provider, setProvider] = useState<BrowserProvider | undefined>()
  const [chainInfo, setChainInfo] = useState<ChainInfo>()
  const [interfaceRepo, setInterfaceRepo] = useState<InterfaceRepository | undefined>()

  useEffect(() => {
    if (!chainInfo) {
      return
    }

    const safeProvider = new SafeAppProvider(safe, sdk)
    const ethersProvider = new BrowserProvider(safeProvider)
    const interfaceRepo = new InterfaceRepository(chainInfo)

    setProvider(ethersProvider)
    setInterfaceRepo(interfaceRepo)
  }, [chainInfo, safe, sdk])

  useEffect(() => {
    const getChainInfo = async () => {
      try {
        const chainInfo = await sdk.safe.getChainInfo()
        setChainInfo(chainInfo)
      } catch (error) {
        console.error('Unable to get chain info:', error)
      }
    }

    getChainInfo()
  }, [sdk.safe])

  const networkPrefix = chainInfo?.shortName || ''

  const nativeCurrencySymbol = chainInfo?.nativeCurrency.symbol

  const getAddressFromDomain = async (name: string): Promise<string> => {
    if (!provider) return name
    try {
      const address = await provider.resolveName(name)
      return address ?? name
    } catch {
      return name
    }
  }

  return (
    <NetworkContext.Provider
      value={{
        sdk,
        safe,
        chainInfo,
        provider,
        interfaceRepo,
        networkPrefix,
        nativeCurrencySymbol,
        getAddressFromDomain,
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export const useNetwork = () => {
  const contextValue = useContext(NetworkContext)
  if (contextValue === null) {
    throw new Error('Component must be wrapped with <TransactionProvider>')
  }

  return contextValue
}

export default NetworkProvider
