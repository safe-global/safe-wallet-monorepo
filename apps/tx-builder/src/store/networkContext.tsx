import { createContext, useContext, useEffect, useState, PropsWithChildren, useCallback } from 'react'
import SafeAppsSDK, { ChainInfo, SafeInfo } from '@safe-global/safe-apps-sdk'
import { BrowserProvider, JsonRpcProvider } from 'ethers'
import { getChainConfig } from '@safe-global/safe-gateway-typescript-sdk'
import InterfaceRepository, { InterfaceRepo } from '../lib/interfaceRepository'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { SafeAppProvider } from '@safe-global/safe-apps-provider'
import { convertChainIdToCoinType, ENS_HUB_SEPOLIA, ETH_COIN_TYPE, getEnsHubChainId } from '../utils/ens'

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

const resolveOnHub = async (name: string, targetChainId: number, isTestnet: boolean): Promise<string | null> => {
  const hubChainId = getEnsHubChainId(isTestnet)
  const hubConfig = await getChainConfig(hubChainId)
  const rpcUrl = hubConfig.publicRpcUri?.value || hubConfig.rpcUri?.value
  if (!rpcUrl) return null

  const hubProvider = new JsonRpcProvider(rpcUrl, Number(hubChainId), { staticNetwork: true })
  try {
    const coinType = convertChainIdToCoinType(targetChainId)
    const address = await hubProvider.resolveName(name, coinType)
    if (address) return address
    if (coinType === ETH_COIN_TYPE) return null

    return (await hubProvider.resolveName(name, ETH_COIN_TYPE)) ?? null
  } finally {
    hubProvider.destroy()
  }
}

const NetworkProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { sdk, safe } = useSafeAppsSDK()
  const [provider, setProvider] = useState<BrowserProvider | undefined>()
  const [chainInfo, setChainInfo] = useState<ChainInfo>()
  const [interfaceRepo, setInterfaceRepo] = useState<InterfaceRepository | undefined>()
  const [isTestnet, setIsTestnet] = useState(false)

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

        // Safe Apps ChainInfo may not include isTestnet; fall back to gateway config.
        try {
          const config = await getChainConfig(chainInfo.chainId)
          setIsTestnet(!!config.isTestnet)
        } catch {
          setIsTestnet(chainInfo.chainId === ENS_HUB_SEPOLIA)
        }
      } catch (error) {
        console.error('Unable to get chain info:', error)
      }
    }

    getChainInfo()
  }, [sdk.safe])

  const networkPrefix = chainInfo?.shortName || ''

  const nativeCurrencySymbol = chainInfo?.nativeCurrency.symbol

  const getAddressFromDomain = useCallback(
    async (name: string): Promise<string> => {
      if (!chainInfo) return name
      try {
        const address = await resolveOnHub(name, Number(chainInfo.chainId), isTestnet)
        return address ?? name
      } catch {
        return name
      }
    },
    [chainInfo, isTestnet],
  )

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
